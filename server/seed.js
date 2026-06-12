require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Job = require('./models/Job');
const Candidate = require('./models/Candidate');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hr-recruitment';

const seedData = async (shouldConnect = true) => {
  try {
    if (shouldConnect) {
      await mongoose.connect(MONGO_URI);
      console.log('Connected to MongoDB for seeding...');
    }

    // Clear existing data
    await User.deleteMany({});
    await Job.deleteMany({});
    await Candidate.deleteMany({});
    console.log('Cleared existing data.');

    // Create users
    const admin = await User.create({ name: 'Admin User', email: 'admin@demo.com', password: 'Admin@123', role: 'admin' });
    const hr = await User.create({ name: 'HR Manager', email: 'hr@demo.com', password: 'Hr@123', role: 'hr' });
    await User.create({ name: 'Viewer User', email: 'viewer@demo.com', password: 'Viewer@123', role: 'viewer' });
    console.log('✅ Users seeded');

    // Create a job
    const job = await Job.create({
      title: 'Senior Full-Stack Engineer',
      department: 'Engineering',
      description: 'We are looking for a Senior Full-Stack Engineer to join our platform team. You will be responsible for designing and implementing scalable web applications, mentoring junior developers, and collaborating with product and design teams. The ideal candidate has deep experience with modern JavaScript frameworks, cloud infrastructure, and a passion for clean, maintainable code.',
      requirements: [
        '5+ years of full-stack development experience',
        'Proficiency in React, Node.js, and TypeScript',
        'Experience with cloud platforms (AWS, GCP, or Azure)',
        'Strong understanding of RESTful APIs and microservices architecture',
        'Experience with SQL and NoSQL databases (PostgreSQL, MongoDB)',
        'Familiarity with CI/CD pipelines and DevOps practices',
        'Excellent communication and team collaboration skills',
        'BS/MS in Computer Science or equivalent experience'
      ],
      status: 'open',
      createdBy: admin._id
    });
    console.log('✅ Job seeded');

    // Create demo candidates
    const candidates = [
      {
        name: 'Sarah Chen',
        email: 'sarah.chen@email.com',
        phone: '+1-555-0101',
        jobId: job._id,
        resumeText: 'Senior Software Engineer with 7 years of experience in React, Node.js, TypeScript, and AWS...',
        currentRole: 'Senior Software Engineer',
        yearsExperience: 7,
        scores: { overall: 92, skills: 95, experience: 90, education: 88, culture_fit: 93 },
        verdict: 'STRONG',
        summary: 'Exceptional candidate with deep full-stack expertise perfectly aligned with the role. Strong track record of building scalable applications and leading technical initiatives. Excellent cultural fit with collaborative mindset.',
        strengths: ['7 years of React and Node.js expertise', 'AWS certified solutions architect', 'Led team of 5 engineers on microservices migration'],
        gaps: ['No explicit PostgreSQL experience mentioned'],
        topSkills: ['React', 'Node.js', 'TypeScript', 'AWS', 'MongoDB'],
        interviewQuestions: ['Describe your approach to microservices architecture.', 'How do you mentor junior developers?', 'Walk us through a complex technical decision you made.'],
        recommendation: 'Strongly recommend for interview — top-tier candidate.',
        status: 'shortlisted'
      },
      {
        name: 'Marcus Johnson',
        email: 'marcus.j@email.com',
        phone: '+1-555-0102',
        jobId: job._id,
        resumeText: 'Full-stack developer with 5 years experience in Vue.js, Python/Django, and Google Cloud...',
        currentRole: 'Full-Stack Developer',
        yearsExperience: 5,
        scores: { overall: 78, skills: 72, experience: 80, education: 82, culture_fit: 78 },
        verdict: 'GOOD',
        summary: 'Solid developer with transferable full-stack skills. Vue.js experience is transferable to React. Python backend experience is strong but would need Node.js ramp-up. Good educational background.',
        strengths: ['5 years full-stack experience', 'GCP certified', 'Strong CS fundamentals from Georgia Tech'],
        gaps: ['No direct React or Node.js experience', 'Limited microservices exposure'],
        topSkills: ['Vue.js', 'Python', 'Django', 'GCP', 'PostgreSQL'],
        interviewQuestions: ['How quickly can you ramp up on React and Node.js?', 'Describe your experience with cloud-native development.', 'How do you approach learning new frameworks?'],
        recommendation: 'Interview — good potential but needs framework ramp-up.',
        status: 'new'
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@email.com',
        phone: '+1-555-0103',
        jobId: job._id,
        resumeText: 'Software Engineer with 6 years experience, specializing in React, Express.js, and Azure...',
        currentRole: 'Software Engineer II',
        yearsExperience: 6,
        scores: { overall: 85, skills: 88, experience: 84, education: 80, culture_fit: 86 },
        verdict: 'STRONG',
        summary: 'Strong candidate with excellent React and Express.js skills closely matching the requirements. Azure cloud experience is transferable. Active open-source contributor showing initiative and community involvement.',
        strengths: ['6 years React + Express.js', 'Active open-source contributor (500+ GitHub stars)', 'Azure DevOps and CI/CD pipeline experience'],
        gaps: ['Azure instead of AWS/GCP', 'No explicit mentoring experience mentioned'],
        topSkills: ['React', 'Express.js', 'TypeScript', 'Azure', 'MongoDB'],
        interviewQuestions: ['Tell us about your open-source contributions.', 'How would you transition from Azure to AWS?', 'Describe a time you helped a colleague solve a difficult problem.'],
        recommendation: 'Interview — strong technical fit with minor cloud platform gap.',
        status: 'interviewing'
      },
      {
        name: 'James Wilson',
        email: 'j.wilson@email.com',
        phone: '+1-555-0104',
        jobId: job._id,
        resumeText: 'Junior developer with 2 years experience in HTML, CSS, jQuery, and PHP...',
        currentRole: 'Junior Web Developer',
        yearsExperience: 2,
        scores: { overall: 35, skills: 30, experience: 25, education: 50, culture_fit: 45 },
        verdict: 'WEAK',
        summary: 'Candidate is significantly under-qualified for a senior role. Only 2 years of experience with legacy technologies. No exposure to modern frameworks, cloud, or microservices architecture.',
        strengths: ['Eager to learn new technologies', 'Bootcamp graduate showing career commitment'],
        gaps: ['Only 2 years experience vs 5+ required', 'No React, Node.js, or TypeScript', 'No cloud platform experience', 'No microservices knowledge'],
        topSkills: ['HTML', 'CSS', 'jQuery', 'PHP', 'MySQL'],
        interviewQuestions: ['What modern frameworks have you explored?', 'What is your learning plan for the next 12 months?'],
        recommendation: 'Skip — significantly under-qualified for senior role.',
        status: 'rejected'
      },
      {
        name: 'Emily Rodriguez',
        email: 'emily.r@email.com',
        phone: '+1-555-0105',
        jobId: job._id,
        resumeText: 'Mid-level developer with 4 years in Angular, Node.js, and AWS Lambda...',
        currentRole: 'Software Developer',
        yearsExperience: 4,
        scores: { overall: 62, skills: 60, experience: 58, education: 70, culture_fit: 65 },
        verdict: 'AVERAGE',
        summary: 'Decent developer with some relevant skills but falls slightly short of senior-level requirements. Angular is transferable to React but would need time. AWS Lambda experience is a plus but overall experience is below the 5-year threshold.',
        strengths: ['Node.js and AWS Lambda experience', 'Strong database skills (both SQL and NoSQL)', 'Computer Science degree'],
        gaps: ['4 years vs 5+ required', 'Angular instead of React', 'No team leadership or mentoring experience'],
        topSkills: ['Angular', 'Node.js', 'AWS Lambda', 'DynamoDB', 'PostgreSQL'],
        interviewQuestions: ['Can you describe your most complex project?', 'How do you see yourself growing into a senior role?', 'What experience do you have leading projects or mentoring?'],
        recommendation: 'Consider if pipeline is thin — borderline candidate.',
        status: 'new'
      }
    ];

    await Candidate.insertMany(candidates);
    console.log('✅ Candidates seeded');

    console.log('\n🎉 Seed complete!');
    console.log('Demo credentials:');
    console.log('  admin@demo.com / Admin@123');
    console.log('  hr@demo.com / Hr@123');
    console.log('  viewer@demo.com / Viewer@123');

    if (shouldConnect) {
      await mongoose.disconnect();
    }

    if (require.main === module) {
      process.exit(0);
    }
  } catch (err) {
    console.error('Seed error:', err);
    if (require.main === module) {
      process.exit(1);
    }
    throw err;
  }
};

if (require.main === module) {
  seedData(true);
}

module.exports = seedData;

