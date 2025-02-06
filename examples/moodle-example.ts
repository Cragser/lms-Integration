import { LMS } from '../src';

async function main() {
  // Initialize the LMS SDK
  const lms = new LMS();

  try {
    // Get courses from Moodle provider
    const courses = await lms.getCourses('moodle');
    console.log('Current Moodle courses:', courses);

    // Create a new course in Moodle
    const newCourse = await lms.createCourse('moodle', {
      name: 'Introduction to Programming',
      description: 'Learn the basics of programming with this comprehensive course',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)) // 3 months duration
    });

    console.log('New course created:', newCourse);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();