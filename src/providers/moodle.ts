import axios from 'axios';
import { LMSConfig, LMSProvider, Course, User, Assignment } from '../types';

export class MoodleProvider implements LMSProvider {
  private baseUrl: string;
  private apiKey?: string;
  private credentials?: LMSConfig['credentials'];

  constructor(config: LMSConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.credentials = config.credentials;
  }

  private async request<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any): Promise<T> {
    const url = `${this.baseUrl}/webservice/rest/server.php`;
    const params = {
      wstoken: this.apiKey,
      moodlewsrestformat: 'json',
      wsfunction: endpoint,
      ...data
    };

    const response = await axios({
      method,
      url,
      params: method === 'GET' ? params : undefined,
      data: method !== 'GET' ? params : undefined
    });

    return response.data;
  }

  async getCourses(): Promise<Course[]> {
    const response = await this.request<any>('core_course_get_courses');
    return response.map((course: any) => ({
      id: course.id.toString(),
      name: course.fullname,
      description: course.summary,
      startDate: course.startdate ? new Date(course.startdate * 1000) : undefined,
      endDate: course.enddate ? new Date(course.enddate * 1000) : undefined
    }));
  }

  async getCourseById(id: string): Promise<Course> {
    const courses = await this.getCourses();
    const course = courses.find(c => c.id === id);
    if (!course) throw new Error(`Course not found: ${id}`);
    return course;
  }

  async createCourse(course: Omit<Course, 'id'>): Promise<Course> {
    const response = await this.request<any>('core_course_create_courses', 'POST', {
      courses: [{
        fullname: course.name,
        shortname: course.name.substring(0, 15),
        summary: course.description,
        startdate: course.startDate?.getTime() ? Math.floor(course.startDate.getTime() / 1000) : undefined,
        enddate: course.endDate?.getTime() ? Math.floor(course.endDate.getTime() / 1000) : undefined
      }]
    });

    return {
      id: response[0].id.toString(),
      ...course
    };
  }

  async updateCourse(id: string, course: Partial<Course>): Promise<Course> {
    await this.request('core_course_update_courses', 'POST', {
      courses: [{
        id: parseInt(id),
        fullname: course.name,
        summary: course.description,
        startdate: course.startDate?.getTime() ? Math.floor(course.startDate.getTime() / 1000) : undefined,
        enddate: course.endDate?.getTime() ? Math.floor(course.endDate.getTime() / 1000) : undefined
      }]
    });

    return this.getCourseById(id);
  }

  async deleteCourse(id: string): Promise<void> {
    await this.request('core_course_delete_courses', 'POST', {
      courseids: [parseInt(id)]
    });
  }

  async getUsers(courseId: string): Promise<User[]> {
    const response = await this.request<any>('core_enrol_get_enrolled_users', 'GET', {
      courseid: parseInt(courseId)
    });

    return response.map((user: any) => ({
      id: user.id.toString(),
      firstName: user.firstname,
      lastName: user.lastname,
      email: user.email,
      role: this.mapMoodleRoleToSDK(user.roles[0].shortname)
    }));
  }

  private mapMoodleRoleToSDK(role: string): User['role'] {
    switch (role) {
      case 'editingteacher':
        return 'teacher';
      case 'student':
        return 'student';
      case 'manager':
        return 'admin';
      default:
        return 'student';
    }
  }

  async getUserById(id: string): Promise<User> {
    const response = await this.request<any>('core_user_get_users_by_field', 'GET', {
      field: 'id',
      values: [parseInt(id)]
    });

    if (!response[0]) throw new Error(`User not found: ${id}`);

    return {
      id: response[0].id.toString(),
      firstName: response[0].firstname,
      lastName: response[0].lastname,
      email: response[0].email,
      role: 'student' // Default role, actual role should be fetched from enrollment
    };
  }

  async enrollUser(courseId: string, userId: string, role: User['role']): Promise<void> {
    await this.request('enrol_manual_enrol_users', 'POST', {
      enrolments: [{
        roleid: this.getMoodleRoleId(role),
        userid: parseInt(userId),
        courseid: parseInt(courseId)
      }]
    });
  }

  private getMoodleRoleId(role: User['role']): number {
    switch (role) {
      case 'teacher':
        return 3; // editingteacher
      case 'student':
        return 5; // student
      case 'admin':
        return 1; // manager
      default:
        return 5; // student
    }
  }

  async getAssignments(courseId: string): Promise<Assignment[]> {
    const response = await this.request<any>('mod_assign_get_assignments', 'GET', {
      courseids: [parseInt(courseId)]
    });

    const assignments: Assignment[] = [];
    for (const course of Object.values<any>(response.courses)) {
      assignments.push(...course.assignments.map((assign: any) => ({
        id: assign.id.toString(),
        courseId: courseId,
        title: assign.name,
        description: assign.intro,
        dueDate: assign.duedate ? new Date(assign.duedate * 1000) : undefined,
        maxScore: assign.grade
      })));
    }

    return assignments;
  }

  async createAssignment(assignment: Omit<Assignment, 'id'>): Promise<Assignment> {
    const response = await this.request<any>('mod_assign_create_assignments', 'POST', {
      assignments: [{
        courseid: parseInt(assignment.courseId),
        name: assignment.title,
        intro: assignment.description,
        duedate: assignment.dueDate?.getTime() ? Math.floor(assignment.dueDate.getTime() / 1000) : undefined,
        grade: assignment.maxScore
      }]
    });

    return {
      id: response[0].assignmentid.toString(),
      ...assignment
    };
  }

  async submitAssignment(assignmentId: string, userId: string, submission: any): Promise<void> {
    await this.request('mod_assign_save_submission', 'POST', {
      assignmentid: parseInt(assignmentId),
      userid: parseInt(userId),
      onlinetext: submission.text,
      plugindata: submission
    });
  }
}