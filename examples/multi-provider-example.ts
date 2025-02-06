import { LMS } from '../src';

async function main() {
  // Initialize the LMS SDK
  const lms = new LMS();

  try {
    // Get all available provider names
    const providers = lms.getProviderNames();
    console.log('Available LMS providers:', providers);

    // Iterate through each provider
    for (const provider of providers) {
      console.log(`\nWorking with ${provider} provider:`);
      
      // Get all courses for current provider
      const courses = await lms.getCourses(provider);
      console.log(`Current courses in ${provider}:`, courses);

      // Create a new English course in current provider
      const newCourse = await lms.createCourse(provider, {
        name: 'Learn English Free',
        description: 'A comprehensive course to learn English language from beginner to advanced level',
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)) // 6 months duration
      });

      console.log(`New English course created in ${provider}:`, newCourse);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();