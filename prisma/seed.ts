import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create research divisions based on requirements
  const divisions = [
    {
      name: 'Social Sciences & Governance',
      description: 'Research focused on governance structures, policy analysis, social institutions, and democratic processes that shape sustainable development in Africa.',
      sdgAlignment: JSON.stringify(['SDG 16: Peace, Justice and Strong Institutions', 'SDG 10: Reduced Inequalities', 'SDG 5: Gender Equality']),
      color: '#003366', // Deep Blue
      icon: 'users'
    },
    {
      name: 'Economics & Development',
      description: 'Economic research examining sustainable development pathways, financial systems, trade, and economic policies for African prosperity.',
      sdgAlignment: JSON.stringify(['SDG 8: Decent Work and Economic Growth', 'SDG 1: No Poverty', 'SDG 9: Industry, Innovation and Infrastructure']),
      color: '#2E8B57', // Emerald Green
      icon: 'trending-up'
    },
    {
      name: 'Environment Climate & Sustainability',
      description: 'Environmental and climate research addressing sustainability challenges, climate adaptation, and environmental policy in African contexts.',
      sdgAlignment: JSON.stringify(['SDG 13: Climate Action', 'SDG 14: Life Below Water', 'SDG 15: Life on Land', 'SDG 7: Affordable and Clean Energy']),
      color: '#228B22', // Forest Green
      icon: 'leaf'
    },
    {
      name: 'Health & Human Development',
      description: 'Research on health systems, human development, education, and social welfare policies that promote well-being across African communities.',
      sdgAlignment: JSON.stringify(['SDG 3: Good Health and Well-being', 'SDG 4: Quality Education', 'SDG 2: Zero Hunger', 'SDG 6: Clean Water and Sanitation']),
      color: '#DC143C', // Crimson
      icon: 'heart'
    },
    {
      name: 'Policy & Innovation',
      description: 'Cross-cutting research on policy innovation, technology adoption, and institutional frameworks that enable sustainable transformation.',
      sdgAlignment: JSON.stringify(['SDG 17: Partnerships for the Goals', 'SDG 9: Industry, Innovation and Infrastructure', 'SDG 11: Sustainable Cities and Communities']),
      color: '#FFD700', // Gold
      icon: 'lightbulb'
    }
  ]

  // Create divisions
  for (const division of divisions) {
    const created = await prisma.researchDivision.upsert({
      where: { name: division.name },
      update: division,
      create: division,
    })
    console.log(`✅ Created/Updated division: ${created.name}`)
  }

  // Create sample leadership team members
  const leadershipMembers = [
    {
      name: 'Dr. Wirajing Muhamadu Awal Kindzeka',
      title: 'Executive Director',
      bio: 'Development Economist and Researcher specializing in fisheries, food security, poverty reduction, and sustainable development. PhD in Development Economics, University of Dschang. Author of 20+ peer-reviewed publications (Energy Policy, Marine Policy). Collaborates with UNDP, CODESRIA, and others. Founder of NGSRN and core member of ReCAD.',
      email: 'wirajing.kindzeka@ngsrn.org',
      linkedinUrl: 'https://linkedin.com/in/wirajing-kindzeka',
      profileImage: '/images/leadership/wirajing-kindzeka.jpg',
      isLeadership: true
    },
    {
      name: 'Dr. Tii N. Nchofoung',
      title: 'Research Director',
      bio: 'Economist, administrator, and researcher with expertise in trade, governance, and inclusive growth. Holds a PhD in Economics (University of Dschang) and ENAM certification. Serves at Cameroon\'s Ministry of Trade and as Research Associate at EXCAS, Belgium. Visiting Scholar at ASPROWORDA and York University\'s Tubman Institute. Published in trade, gender, and governance research.',
      email: 'tii.nchofoung@ngsrn.org',
      linkedinUrl: 'https://linkedin.com/in/tii-nchofoung',
      profileImage: '/images/leadership/tii-nchofoung.jpg',
      isLeadership: true
    },
    {
      name: 'Mr. Germain Stephane Ketchoua',
      title: 'Director of Administration & Outreach',
      bio: 'PhD candidate at the University of Johannesburg (SARChI-ID). Research focuses on industrialization, structural transformation, and sustainability in Africa. Published in peer-reviewed journals on industrial policy, digitalization, and resilience. Bridges research and policy for inclusive industrial strategies.',
      email: 'germain.ketchoua@ngsrn.org',
      linkedinUrl: 'https://linkedin.com/in/germain-ketchoua',
      profileImage: '/images/leadership/germain-ketchoua.jpg',
      isLeadership: true
    },
    {
      name: 'Dr. Isaac Ketu',
      title: 'Finance & Operations Manager',
      bio: 'PhD in Economics (University of Dschang), Research Associate at CERME. Founding member of NGSRN. Specializes in macroeconomics, energy transition, globalization, and informal economy. Publications in African Development Review, International Development Journal, and more. Regular evaluator and reviewer for international journals.',
      email: 'isaac.ketu@ngsrn.org',
      linkedinUrl: 'https://linkedin.com/in/isaac-ketu',
      profileImage: '/images/leadership/isaac-ketu.jpg',
      isLeadership: true
    },
    {
      name: 'Dr. Ali Haruna',
      title: 'Director of Communications',
      bio: 'Lecturer at PKFokam Institute of Excellence, Yaoundé. PhD in Economics (University of Dschang). Research in Islamic finance, entrepreneurship, and financial inclusion. 10+ publications in leading journals (Borsa Istanbul Review, Review of Development Economics). Editor at Journal of Islamic Economic Laws and International Journal of Islamic Economics.',
      email: 'aliharuna504@gmail.com',
      linkedinUrl: 'https://linkedin.com/in/ali-haruna',
      profileImage: '/images/leadership/ali-haruna.jpg',
      isLeadership: true
    }
  ]

  // Create leadership team members
  for (const member of leadershipMembers) {
    const created = await prisma.author.upsert({
      where: { email: member.email },
      update: member,
      create: member,
    })
    console.log(`✅ Created/Updated leadership member: ${created.name}`)
  }

  // Create admin user with hashed password
  const passwordHash = await bcrypt.hash('admin123', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ngsrn.org' },
    update: {
      name: 'NGSRN Administrator',
      role: 'ADMIN',
      passwordHash
    },
    create: {
      email: 'admin@ngsrn.org',
      name: 'NGSRN Administrator',
      role: 'ADMIN',
      passwordHash
    }
  })
  console.log(`✅ Created/Updated admin user: ${adminUser.email}`)

  // Create editor user for testing
  const editorPasswordHash = await bcrypt.hash('editor123', 12)
  const editorUser = await prisma.user.upsert({
    where: { email: 'editor@ngsrn.org' },
    update: {
      name: 'NGSRN Editor',
      role: 'EDITOR',
      passwordHash: editorPasswordHash
    },
    create: {
      email: 'editor@ngsrn.org',
      name: 'NGSRN Editor',
      role: 'EDITOR',
      passwordHash: editorPasswordHash
    }
  })
  console.log(`✅ Created/Updated editor user: ${editorUser.email}`)

  // Create sample articles for testing
  const sampleArticles = [
    {
      title: "Sustainable Agriculture Practices in Sub-Saharan Africa",
      slug: "sustainable-agriculture-practices-sub-saharan-africa",
      content: `# Sustainable Agriculture Practices in Sub-Saharan Africa

## Introduction

Agriculture remains the backbone of many Sub-Saharan African economies, employing over 60% of the population and contributing significantly to GDP. However, the sector faces numerous challenges including climate change, soil degradation, and limited access to modern farming technologies.

## Key Challenges

### Climate Change Impact
Climate variability and extreme weather events pose significant threats to agricultural productivity. Farmers are experiencing:

- Irregular rainfall patterns
- Prolonged droughts
- Increased frequency of floods
- Rising temperatures affecting crop yields

### Soil Degradation
Soil fertility decline is a major concern across the region:

1. **Nutrient depletion** due to continuous cropping without adequate fertilization
2. **Erosion** caused by poor land management practices
3. **Salinization** in irrigated areas
4. **Compaction** from heavy machinery and overgrazing

## Sustainable Solutions

### Agroecological Approaches

**Crop Rotation and Diversification**
Implementing diverse cropping systems helps maintain soil health and reduces pest pressure. Farmers are adopting:

- Legume-cereal rotations to fix nitrogen naturally
- Intercropping systems that maximize land use efficiency
- Indigenous crop varieties adapted to local conditions

**Conservation Agriculture**
This approach focuses on three main principles:
1. Minimal soil disturbance
2. Permanent soil cover
3. Crop rotation and diversification

### Technology Integration

Modern technologies are being adapted to local contexts:

- **Precision agriculture** using mobile apps for crop monitoring
- **Drip irrigation** systems for water conservation
- **Solar-powered** equipment for processing and storage

## Policy Recommendations

Governments and international organizations should prioritize:

1. Investment in agricultural research and development
2. Support for farmer education and training programs
3. Development of climate-resilient infrastructure
4. Promotion of sustainable land management practices

## Conclusion

Sustainable agriculture in Sub-Saharan Africa requires a holistic approach that combines traditional knowledge with modern innovations. Success depends on coordinated efforts from farmers, governments, and international partners to build resilient food systems that can adapt to changing environmental conditions.

> "The future of African agriculture lies in sustainable practices that work with nature, not against it." - Dr. Amina Hassan, Agricultural Sustainability Expert

## References

- FAO. (2023). State of Food Security and Nutrition in the World
- World Bank. (2023). Climate Change Action Plan for Agriculture
- CGIAR. (2023). Sustainable Intensification of Agricultural Systems`,
      summary: "An analysis of sustainable agriculture practices in Sub-Saharan Africa, examining challenges like climate change and soil degradation while proposing agroecological solutions and policy recommendations for building resilient food systems.",
      tags: JSON.stringify(["agriculture", "sustainability", "climate-change", "food-security", "africa"]),
      status: "PUBLISHED" as const,
      publishedAt: new Date("2024-01-15"),
      readTime: 8,
      seoTitle: "Sustainable Agriculture Practices in Sub-Saharan Africa | NGSRN Research",
      seoDescription: "Comprehensive analysis of sustainable agriculture challenges and solutions in Sub-Saharan Africa, focusing on climate adaptation and food security.",
      seoKeywords: JSON.stringify(["sustainable agriculture", "Sub-Saharan Africa", "climate change", "food security", "agroecology"])
    },
    {
      title: "Gender Equity in African Higher Education: Progress and Challenges",
      slug: "gender-equity-african-higher-education-progress-challenges",
      content: `# Gender Equity in African Higher Education: Progress and Challenges

## Executive Summary

This research examines the current state of gender equity in African higher education institutions, analyzing enrollment trends, faculty representation, and institutional policies across the continent.

## Current Landscape

### Enrollment Trends

African higher education has witnessed significant growth in female enrollment over the past two decades:

- **Overall enrollment**: Women now represent 45% of total higher education enrollment
- **Field disparities**: Significant gaps remain in STEM fields (32% female) vs. humanities (68% female)
- **Graduate studies**: Women comprise 42% of master's students and 38% of doctoral candidates

### Faculty Representation

Gender representation among faculty remains a critical challenge:

| Position Level | Female Representation |
|----------------|----------------------|
| Lecturers | 38% |
| Senior Lecturers | 31% |
| Associate Professors | 24% |
| Full Professors | 18% |

## Key Challenges

### 1. Structural Barriers

**Financial Constraints**
- Limited access to scholarships and funding
- Economic pressures forcing early workforce entry
- Inadequate financial support for research activities

**Cultural and Social Factors**
- Traditional gender roles and expectations
- Early marriage and childbearing responsibilities
- Limited family support for women's education

### 2. Institutional Barriers

**Policy Gaps**
Many institutions lack comprehensive gender policies addressing:
- Sexual harassment and discrimination
- Work-life balance support
- Career advancement pathways
- Mentorship programs

**Infrastructure Limitations**
- Inadequate childcare facilities
- Poor campus safety and security
- Limited accommodation for female students

## Success Stories and Best Practices

### University of Cape Town (South Africa)
- Implemented comprehensive gender transformation strategy
- Achieved 45% female faculty representation
- Established dedicated gender studies programs

### Makerere University (Uganda)
- Created women-only hostels with enhanced security
- Launched mentorship programs for female STEM students
- Introduced flexible academic schedules for working mothers

### University of Ghana
- Developed anti-sexual harassment policies
- Established childcare centers on campus
- Created women's leadership development programs

## Recommendations

### For Institutions

1. **Policy Development**
   - Implement comprehensive gender equity policies
   - Establish clear reporting mechanisms for discrimination
   - Create family-friendly workplace policies

2. **Infrastructure Investment**
   - Build adequate childcare facilities
   - Improve campus safety and security
   - Provide gender-sensitive accommodation

3. **Academic Support**
   - Develop mentorship programs
   - Offer research funding specifically for women
   - Create networking opportunities

### For Governments

1. **Legislative Framework**
   - Enact and enforce gender equity laws
   - Mandate gender reporting in higher education
   - Provide targeted funding for women's education

2. **Financial Support**
   - Increase scholarship opportunities for women
   - Support research grants for female academics
   - Fund infrastructure improvements

## Conclusion

While significant progress has been made in promoting gender equity in African higher education, substantial challenges remain. Achieving true equity requires coordinated efforts from institutions, governments, and society at large.

The path forward involves addressing both structural and cultural barriers while building on existing successes and best practices across the continent.`,
      summary: "A comprehensive examination of gender equity in African higher education, analyzing enrollment trends, faculty representation, and institutional challenges while highlighting successful interventions and policy recommendations.",
      tags: JSON.stringify(["gender-equity", "higher-education", "africa", "women-empowerment", "education-policy"]),
      status: "PUBLISHED" as const,
      publishedAt: new Date("2024-02-20"),
      readTime: 12,
      seoTitle: "Gender Equity in African Higher Education | NGSRN Research",
      seoDescription: "Analysis of gender equity progress and challenges in African higher education institutions, with policy recommendations for achieving equality.",
      seoKeywords: JSON.stringify(["gender equity", "African higher education", "women in academia", "education policy", "gender equality"])
    }
  ]

  // Get research divisions for article assignment
  const socialSciencesDivision = await prisma.researchDivision.findFirst({
    where: { name: "Social Sciences & Governance" }
  })
  
  const environmentDivision = await prisma.researchDivision.findFirst({
    where: { name: "Environment Climate & Sustainability" }
  })

  // Get authors for article assignment
  const aminaKone = await prisma.author.findFirst({
    where: { email: "amina.kone@ngsrn.org" }
  })
  
  const kwameAsante = await prisma.author.findFirst({
    where: { email: "kwame.asante@ngsrn.org" }
  })

  // Create articles
  if (environmentDivision && aminaKone) {
    const article1 = await prisma.article.upsert({
      where: { slug: sampleArticles[0].slug },
      update: sampleArticles[0],
      create: {
        ...sampleArticles[0],
        divisionId: environmentDivision.id
      }
    })
    
    // Connect author to article
    await prisma.articleAuthor.upsert({
      where: {
        articleId_authorId: {
          articleId: article1.id,
          authorId: aminaKone.id
        }
      },
      update: { order: 0 },
      create: {
        articleId: article1.id,
        authorId: aminaKone.id,
        order: 0
      }
    })
    
    console.log(`✅ Created/Updated article: ${article1.title}`)
  }

  if (socialSciencesDivision && kwameAsante) {
    const article2 = await prisma.article.upsert({
      where: { slug: sampleArticles[1].slug },
      update: sampleArticles[1],
      create: {
        ...sampleArticles[1],
        divisionId: socialSciencesDivision.id
      }
    })
    
    // Connect author to article
    await prisma.articleAuthor.upsert({
      where: {
        articleId_authorId: {
          articleId: article2.id,
          authorId: kwameAsante.id
        }
      },
      update: { order: 0 },
      create: {
        articleId: article2.id,
        authorId: kwameAsante.id,
        order: 0
      }
    })
    
    console.log(`✅ Created/Updated article: ${article2.title}`)
  }

  // Connect leadership members to their research divisions
  const leadershipConnections = [
    { email: 'wirajing.kindzeka@ngsrn.org', divisions: ['Economics & Development', 'Environment Climate & Sustainability'] },
    { email: 'tii.nchofoung@ngsrn.org', divisions: ['Economics & Development', 'Social Sciences & Governance'] },
    { email: 'germain.ketchoua@ngsrn.org', divisions: ['Policy & Innovation', 'Economics & Development'] },
    { email: 'isaac.ketu@ngsrn.org', divisions: ['Economics & Development'] },
    { email: 'aliharuna504@gmail.com', divisions: ['Economics & Development', 'Social Sciences & Governance'] }
  ]

  for (const connection of leadershipConnections) {
    const author = await prisma.author.findFirst({
      where: { email: connection.email }
    })
    
    if (author) {
      for (const divisionName of connection.divisions) {
        const division = await prisma.researchDivision.findFirst({
          where: { name: divisionName }
        })
        
        if (division) {
          await prisma.authorDivision.upsert({
            where: {
              authorId_divisionId: {
                authorId: author.id,
                divisionId: division.id
              }
            },
            update: {},
            create: {
              authorId: author.id,
              divisionId: division.id
            }
          })
          console.log(`✅ Connected ${author.name} to ${division.name}`)
        }
      }
    }
  }

  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })