#!/usr/bin/env node

/**
 * Health Check Script
 * Performs a quick health check of the deployed application
 */

const https = require('https');
const http = require('http');

async function performHealthCheck(url) {
  console.log('🏥 NGSRN Application Health Check');
  console.log('================================');
  console.log(`Target: ${url}`);
  console.log('');

  // Initialize build monitoring if available
  let buildMonitor = null;
  try {
    const BuildMonitor = require('./build-monitor');
    buildMonitor = new BuildMonitor();
  } catch (error) {
    // Build monitoring not available
  }

  const results = {
    connectivity: false,
    responseTime: 0,
    statusCode: 0,
    healthEndpoint: false,
    deploymentStatus: false,
    buildValidation: false,
    buildHealth: false
  };

  try {
    // 1. Basic connectivity check
    console.log('1️⃣  Basic Connectivity');
    console.log('─'.repeat(25));
    const connectivityResult = await checkConnectivity(url);
    results.connectivity = connectivityResult.success;
    results.responseTime = connectivityResult.responseTime;
    results.statusCode = connectivityResult.statusCode;
    
    if (results.connectivity) {
      console.log(`✅ Site is accessible (${results.responseTime}ms)`);
      console.log(`📊 Status Code: ${results.statusCode}`);
    } else {
      console.error('❌ Site is not accessible');
    }
    console.log('');

    // 2. Health endpoint check
    console.log('2️⃣  Health Endpoint');
    console.log('─'.repeat(25));
    results.healthEndpoint = await checkHealthEndpoint(url);
    console.log('');

    // 3. Deployment status check
    console.log('3️⃣  Deployment Status');
    console.log('─'.repeat(25));
    results.deploymentStatus = await checkDeploymentStatus(url);
    console.log('');

    // 4. Build validation check
    console.log('4️⃣  Build Validation');
    console.log('─'.repeat(25));
    results.buildValidation = await checkBuildValidation(url);
    console.log('');

    // 5. Build health monitoring check
    console.log('5️⃣  Build Health Monitoring');
    console.log('─'.repeat(25));
    results.buildHealth = await checkBuildHealth(url, buildMonitor);
    console.log('');

    // Summary
    console.log('📊 Health Check Summary');
    console.log('─'.repeat(25));
    printHealthSummary(results);

    const overallHealth = calculateOverallHealth(results);
    console.log('');
    
    if (overallHealth >= 80) {
      console.log('🎉 Application is healthy!');
      return true;
    } else if (overallHealth >= 60) {
      console.log('⚠️  Application has some issues but is functional');
      return true;
    } else {
      console.error('❌ Application has significant health issues');
      return false;
    }

  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

function checkConnectivity(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const client = url.startsWith('https:') ? https : http;
    
    const request = client.get(url, (response) => {
      const responseTime = Date.now() - startTime;
      resolve({
        success: response.statusCode >= 200 && response.statusCode < 400,
        responseTime,
        statusCode: response.statusCode
      });
    });

    request.on('error', (error) => {
      resolve({
        success: false,
        responseTime: Date.now() - startTime,
        statusCode: 0,
        error: error.message
      });
    });

    request.setTimeout(10000, () => {
      request.destroy();
      resolve({
        success: false,
        responseTime: Date.now() - startTime,
        statusCode: 0,
        error: 'Timeout'
      });
    });
  });
}

async function checkHealthEndpoint(baseUrl) {
  try {
    const healthUrl = `${baseUrl}/api/monitoring/health`;
    const result = await makeRequest(healthUrl);
    
    if (result.success && result.data) {
      const healthData = JSON.parse(result.data);
      console.log(`✅ Health endpoint accessible`);
      console.log(`📊 Status: ${healthData.status}`);
      console.log(`⏱️  Uptime: ${Math.round(healthData.uptime)}s`);
      console.log(`🌍 Environment: ${healthData.environment}`);
      
      if (healthData.deployment) {
        console.log(`📦 Phase: ${healthData.deployment.phase}`);
      }
      
      return healthData.status === 'healthy';
    } else {
      console.error('❌ Health endpoint not accessible');
      return false;
    }
  } catch (error) {
    console.error('❌ Health endpoint check failed:', error.message);
    return false;
  }
}

async function checkDeploymentStatus(baseUrl) {
  try {
    const deploymentUrl = `${baseUrl}/api/monitoring/deployment`;
    const result = await makeRequest(deploymentUrl);
    
    if (result.success && result.data) {
      const deploymentData = JSON.parse(result.data);
      console.log(`✅ Deployment status accessible`);
      console.log(`📦 Phase: ${deploymentData.deployment.phase}`);
      console.log(`🌍 Environment: ${deploymentData.deployment.environment}`);
      
      if (deploymentData.vercel) {
        console.log(`☁️  Vercel Region: ${deploymentData.deployment.vercel.region}`);
      }
      
      return true;
    } else {
      console.error('❌ Deployment status not accessible');
      return false;
    }
  } catch (error) {
    console.error('❌ Deployment status check failed:', error.message);
    return false;
  }
}

async function checkBuildValidation(baseUrl) {
  try {
    const buildUrl = `${baseUrl}/api/monitoring/build`;
    const result = await makeRequest(buildUrl);
    
    if (result.success && result.data) {
      const buildData = JSON.parse(result.data);
      console.log(`✅ Build validation accessible`);
      
      if (buildData.assets) {
        console.log(`📁 Assets: ${buildData.assets.present}/${buildData.assets.total} present`);
      }
      
      if (buildData.configuration) {
        console.log(`⚙️  Configuration: ${buildData.configuration.status}`);
      }
      
      return buildData.assets?.status !== 'error' && buildData.configuration?.status !== 'error';
    } else {
      console.error('❌ Build validation not accessible');
      return false;
    }
  } catch (error) {
    console.error('❌ Build validation check failed:', error.message);
    return false;
  }
}

async function checkBuildHealth(baseUrl, buildMonitor) {
  try {
    // Check build health API endpoint
    const buildHealthUrl = `${baseUrl}/api/monitoring/build-health?action=health`;
    const result = await makeRequest(buildHealthUrl);
    
    if (result.success && result.data) {
      const healthData = JSON.parse(result.data);
      console.log(`✅ Build health monitoring accessible`);
      console.log(`📊 Overall Health: ${healthData.overall.status.toUpperCase()} (${healthData.overall.score}/100)`);
      console.log(`📈 Success Rate: ${Math.round(healthData.buildSuccess.rate * 100)}%`);
      console.log(`📊 Total Builds: ${healthData.buildSuccess.totalBuilds}`);
      console.log(`📉 Recent Failures: ${healthData.buildSuccess.recentFailures}`);
      
      if (healthData.configurationDrift.hasDrift) {
        console.log(`⚠️  Configuration Drift: ${healthData.configurationDrift.severity} severity`);
      } else {
        console.log(`✅ No Configuration Drift`);
      }
      
      if (healthData.activeAlerts.length > 0) {
        console.log(`🚨 Active Alerts: ${healthData.activeAlerts.length}`);
        healthData.activeAlerts.slice(0, 3).forEach(alert => {
          console.log(`   - ${alert.severity.toUpperCase()}: ${alert.message}`);
        });
      } else {
        console.log(`✅ No Active Alerts`);
      }
      
      return healthData.overall.status !== 'critical';
    } else {
      console.error('❌ Build health monitoring not accessible');
      
      // Fallback to local monitoring if available
      if (buildMonitor) {
        console.log('ℹ️  Checking local build monitoring...');
        const localHealth = buildMonitor.generateHealthReport();
        console.log(`📊 Local Health: ${localHealth.overall.status.toUpperCase()} (${localHealth.overall.score}/100)`);
        return localHealth.overall.status !== 'critical';
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ Build health check failed:', error.message);
    
    // Fallback to local monitoring if available
    if (buildMonitor) {
      try {
        console.log('ℹ️  Attempting local build health check...');
        const localHealth = buildMonitor.generateHealthReport();
        console.log(`📊 Local Health: ${localHealth.overall.status.toUpperCase()} (${localHealth.overall.score}/100)`);
        return localHealth.overall.status !== 'critical';
      } catch (localError) {
        console.error('❌ Local build health check also failed:', localError.message);
      }
    }
    
    return false;
  }
}

function makeRequest(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http;
    
    const request = client.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve({
          success: response.statusCode >= 200 && response.statusCode < 400,
          statusCode: response.statusCode,
          data
        });
      });
    });

    request.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    request.setTimeout(10000, () => {
      request.destroy();
      resolve({
        success: false,
        error: 'Timeout'
      });
    });
  });
}

function printHealthSummary(results) {
  const checks = [
    { name: 'Connectivity', status: results.connectivity },
    { name: 'Health Endpoint', status: results.healthEndpoint },
    { name: 'Deployment Status', status: results.deploymentStatus },
    { name: 'Build Validation', status: results.buildValidation },
    { name: 'Build Health Monitoring', status: results.buildHealth }
  ];

  checks.forEach(check => {
    const status = check.status ? '✅' : '❌';
    console.log(`${status} ${check.name}`);
  });

  if (results.responseTime > 0) {
    console.log(`⏱️  Average Response Time: ${results.responseTime}ms`);
  }
}

function calculateOverallHealth(results) {
  const weights = {
    connectivity: 30,
    healthEndpoint: 20,
    deploymentStatus: 15,
    buildValidation: 15,
    buildHealth: 20
  };

  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(weights).forEach(([key, weight]) => {
    if (results[key]) {
      totalScore += weight;
    }
    totalWeight += weight;
  });

  return Math.round((totalScore / totalWeight) * 100);
}

async function main() {
  const url = process.argv[2];
  
  if (!url) {
    console.error('❌ Please provide a URL to check');
    console.log('Usage: node health-check.js <url>');
    console.log('Example: node health-check.js https://your-app.vercel.app');
    process.exit(1);
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    console.error('❌ Invalid URL format');
    process.exit(1);
  }

  const success = await performHealthCheck(url);
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Health check script failed:', error);
    process.exit(1);
  });
}

module.exports = {
  performHealthCheck,
  checkConnectivity,
  checkHealthEndpoint,
  checkDeploymentStatus,
  checkBuildValidation
};