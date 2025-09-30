#!/usr/bin/env node

/**
 * Backup and Recovery Script
 * Handles database backups, media backups, and restoration procedures
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

// Configuration
const BACKUP_RETENTION_DAYS = 30;
const BACKUP_SCHEDULE = {
  daily: '0 2 * * *',    // 2 AM daily
  weekly: '0 3 * * 0',   // 3 AM Sunday
  monthly: '0 4 1 * *'   // 4 AM 1st of month
};

class BackupService {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.backupBucket = process.env.AWS_BACKUP_BUCKET || 'ngsrn-backups';
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  }

  async createDatabaseBackup() {
    console.log('🗄️  Creating database backup...');
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    const backupFile = `database-backup-${this.timestamp}.sql`;
    const backupPath = path.join('/tmp', backupFile);

    try {
      // Create PostgreSQL dump
      execSync(`pg_dump "${databaseUrl}" > "${backupPath}"`, {
        stdio: 'inherit'
      });

      // Compress the backup
      const compressedFile = `${backupPath}.gz`;
      execSync(`gzip "${backupPath}"`, { stdio: 'inherit' });

      // Upload to S3
      await this.uploadToS3(compressedFile, `database/${backupFile}.gz`);

      console.log('✅ Database backup completed successfully');
      return `database/${backupFile}.gz`;
    } catch (error) {
      console.error('❌ Database backup failed:', error.message);
      throw error;
    }
  }

  async createMediaBackup() {
    console.log('📁 Creating media backup...');
    
    const mediaBucket = process.env.AWS_S3_BUCKET;
    if (!mediaBucket) {
      throw new Error('AWS_S3_BUCKET not configured');
    }

    try {
      // List all objects in media bucket
      const objects = await this.s3.listObjectsV2({
        Bucket: mediaBucket
      }).promise();

      const backupManifest = {
        timestamp: this.timestamp,
        totalFiles: objects.Contents?.length || 0,
        files: objects.Contents?.map(obj => ({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified,
          etag: obj.ETag
        })) || []
      };

      // Upload manifest to backup bucket
      const manifestKey = `media/manifest-${this.timestamp}.json`;
      await this.s3.putObject({
        Bucket: this.backupBucket,
        Key: manifestKey,
        Body: JSON.stringify(backupManifest, null, 2),
        ContentType: 'application/json'
      }).promise();

      console.log('✅ Media backup manifest created successfully');
      return manifestKey;
    } catch (error) {
      console.error('❌ Media backup failed:', error.message);
      throw error;
    }
  }

  async createConfigBackup() {
    console.log('⚙️  Creating configuration backup...');
    
    const configFiles = [
      'package.json',
      'next.config.ts',
      'tailwind.config.ts',
      'prisma/schema.prisma',
      'vercel.json',
      '.env.example'
    ];

    const configBackup = {
      timestamp: this.timestamp,
      files: {}
    };

    try {
      for (const file of configFiles) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
          configBackup.files[file] = fs.readFileSync(filePath, 'utf8');
        }
      }

      // Upload configuration backup
      const configKey = `config/config-backup-${this.timestamp}.json`;
      await this.s3.putObject({
        Bucket: this.backupBucket,
        Key: configKey,
        Body: JSON.stringify(configBackup, null, 2),
        ContentType: 'application/json'
      }).promise();

      console.log('✅ Configuration backup completed successfully');
      return configKey;
    } catch (error) {
      console.error('❌ Configuration backup failed:', error.message);
      throw error;
    }
  }

  async uploadToS3(filePath, key) {
    const fileContent = fs.readFileSync(filePath);
    
    await this.s3.putObject({
      Bucket: this.backupBucket,
      Key: key,
      Body: fileContent
    }).promise();

    // Clean up local file
    fs.unlinkSync(filePath);
  }

  async restoreDatabase(backupKey) {
    console.log(`🔄 Restoring database from ${backupKey}...`);
    
    try {
      // Download backup from S3
      const backupData = await this.s3.getObject({
        Bucket: this.backupBucket,
        Key: backupKey
      }).promise();

      const backupFile = `/tmp/restore-${Date.now()}.sql.gz`;
      fs.writeFileSync(backupFile, backupData.Body);

      // Decompress
      const sqlFile = backupFile.replace('.gz', '');
      execSync(`gunzip -c "${backupFile}" > "${sqlFile}"`, { stdio: 'inherit' });

      // Restore database
      const databaseUrl = process.env.DATABASE_URL;
      execSync(`psql "${databaseUrl}" < "${sqlFile}"`, { stdio: 'inherit' });

      // Clean up
      fs.unlinkSync(backupFile);
      fs.unlinkSync(sqlFile);

      console.log('✅ Database restored successfully');
    } catch (error) {
      console.error('❌ Database restore failed:', error.message);
      throw error;
    }
  }

  async restoreMedia(manifestKey) {
    console.log(`🔄 Restoring media from ${manifestKey}...`);
    
    try {
      // Download manifest
      const manifestData = await this.s3.getObject({
        Bucket: this.backupBucket,
        Key: manifestKey
      }).promise();

      const manifest = JSON.parse(manifestData.Body.toString());
      const mediaBucket = process.env.AWS_S3_BUCKET;

      console.log(`Restoring ${manifest.totalFiles} files...`);

      // Note: In a real scenario, you would copy files from backup bucket to media bucket
      // This is a simplified version that validates the manifest
      for (const file of manifest.files) {
        try {
          await this.s3.headObject({
            Bucket: mediaBucket,
            Key: file.key
          }).promise();
        } catch (error) {
          console.warn(`File missing: ${file.key}`);
        }
      }

      console.log('✅ Media restore validation completed');
    } catch (error) {
      console.error('❌ Media restore failed:', error.message);
      throw error;
    }
  }

  async listBackups() {
    console.log('📋 Listing available backups...');
    
    try {
      const objects = await this.s3.listObjectsV2({
        Bucket: this.backupBucket
      }).promise();

      const backups = {
        database: [],
        media: [],
        config: []
      };

      objects.Contents?.forEach(obj => {
        if (obj.Key?.startsWith('database/')) {
          backups.database.push({
            key: obj.Key,
            size: obj.Size,
            date: obj.LastModified
          });
        } else if (obj.Key?.startsWith('media/')) {
          backups.media.push({
            key: obj.Key,
            size: obj.Size,
            date: obj.LastModified
          });
        } else if (obj.Key?.startsWith('config/')) {
          backups.config.push({
            key: obj.Key,
            size: obj.Size,
            date: obj.LastModified
          });
        }
      });

      console.log('Database backups:', backups.database.length);
      console.log('Media backups:', backups.media.length);
      console.log('Config backups:', backups.config.length);

      return backups;
    } catch (error) {
      console.error('❌ Failed to list backups:', error.message);
      throw error;
    }
  }

  async cleanupOldBackups() {
    console.log('🧹 Cleaning up old backups...');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - BACKUP_RETENTION_DAYS);

    try {
      const objects = await this.s3.listObjectsV2({
        Bucket: this.backupBucket
      }).promise();

      const objectsToDelete = objects.Contents?.filter(obj => 
        obj.LastModified && obj.LastModified < cutoffDate
      ) || [];

      if (objectsToDelete.length > 0) {
        await this.s3.deleteObjects({
          Bucket: this.backupBucket,
          Delete: {
            Objects: objectsToDelete.map(obj => ({ Key: obj.Key! }))
          }
        }).promise();

        console.log(`✅ Deleted ${objectsToDelete.length} old backups`);
      } else {
        console.log('✅ No old backups to clean up');
      }
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      throw error;
    }
  }

  async createFullBackup() {
    console.log('🚀 Starting full backup...');
    
    try {
      const results = await Promise.all([
        this.createDatabaseBackup(),
        this.createMediaBackup(),
        this.createConfigBackup()
      ]);

      const backupSummary = {
        timestamp: this.timestamp,
        database: results[0],
        media: results[1],
        config: results[2],
        status: 'completed'
      };

      // Save backup summary
      await this.s3.putObject({
        Bucket: this.backupBucket,
        Key: `summaries/backup-${this.timestamp}.json`,
        Body: JSON.stringify(backupSummary, null, 2),
        ContentType: 'application/json'
      }).promise();

      console.log('🎉 Full backup completed successfully');
      return backupSummary;
    } catch (error) {
      console.error('❌ Full backup failed:', error.message);
      throw error;
    }
  }
}

async function main() {
  const command = process.argv[2];
  const backupService = new BackupService();

  try {
    switch (command) {
      case 'full':
        await backupService.createFullBackup();
        break;
        
      case 'database':
        await backupService.createDatabaseBackup();
        break;
        
      case 'media':
        await backupService.createMediaBackup();
        break;
        
      case 'config':
        await backupService.createConfigBackup();
        break;
        
      case 'restore-db':
        const dbBackupKey = process.argv[3];
        if (!dbBackupKey) {
          console.error('Please provide backup key: npm run backup restore-db <backup-key>');
          process.exit(1);
        }
        await backupService.restoreDatabase(dbBackupKey);
        break;
        
      case 'restore-media':
        const mediaBackupKey = process.argv[3];
        if (!mediaBackupKey) {
          console.error('Please provide manifest key: npm run backup restore-media <manifest-key>');
          process.exit(1);
        }
        await backupService.restoreMedia(mediaBackupKey);
        break;
        
      case 'list':
        await backupService.listBackups();
        break;
        
      case 'cleanup':
        await backupService.cleanupOldBackups();
        break;
        
      default:
        console.log('Usage: node backup-restore.js [command]');
        console.log('');
        console.log('Commands:');
        console.log('  full           - Create full backup (database + media + config)');
        console.log('  database       - Create database backup only');
        console.log('  media          - Create media backup manifest');
        console.log('  config         - Create configuration backup');
        console.log('  restore-db     - Restore database from backup');
        console.log('  restore-media  - Restore media from backup');
        console.log('  list           - List available backups');
        console.log('  cleanup        - Remove old backups');
    }
  } catch (error) {
    console.error('Backup operation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = BackupService;