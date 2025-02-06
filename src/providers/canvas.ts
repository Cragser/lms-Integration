import axios from 'axios';
import { LMSConfig, LMSProvider, Course, User, Assignment } from '../types';

export class CanvasProvider implements LMSProvider {
  private baseUrl: string;
  private apiKey?: string;
  private credentials?: LMSConfig['credentials'];

  constructor(config: LMSConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.credentials = config.credentials;
  }

  private async request<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any): Promise<T> {
    const url = `${this.baseUrl}/api/v1/${endpoint}`;
    const response = await axios({
      method,
      url,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      params: method === 'GET' ? data : undefined,
      data: method !== 'GET' ? data : undefined
    });

    return response.data;
  }

  async getCourses(): Promise<Course[]> {
    const response = await this.request<any[]>('courses');
    return response.map(course => ({
      id: course.id.toString(),
      name: course.name,
      description: course.public_description,
      startDate: course.start_at ? new Date(course.start_at) : undefined,
      endDate: course.end_at ? new Date(course.end_at) : undefined
    }));
  }

  async getCourseById(id: string): Promise<Course> {
    const response = await this.request<any>(`courses/${id}`);
    return {
      id: response.id.toString(),
      name: response.name,
      description: response.public_description,
      startDate: response.start_at ? new Date(response.start_at) : undefined,
      endDate: response.end_at ? new Date(response.end_at) : undefined
    };
  }

  async createCourse(course: Omit<Course, 'id'>): Promise<Course> {
    const response = await this.request<any>('courses', 'POST', {
      course: {
        name: course.name,
        public_description: course.description,
        start_at: course.startDate?.toISOString(),
        end_at: course.endDate?.toISOString()
      }
    });

    return {
      id: response.id.toString(),
      name: response.name,
      description: response.public_description,
      startDate: response.start_at ? new Date(response.start_at) : undefined,
      endDate: response.end_at ? new Date(response.end_at) : undefined
    };
  }

  async updateCourse(id: string, course: Partial<Course>): Promise<Course> {
    const response = await this.request<any>(`courses/${id}`, 'PUT', {
      course: {
        name: course.name,
        public_description: course.description,
        start_at: course.startDate?.toISOString(),
        end_at: course.endDate?.toISOString()
      }
    });

    return {
      id: response.id.toString(),
      name: response.name,
      description: response.public_description,
      startDate: response.start_at ? new Date(response.start_at) : undefined,
      endDate: response.end_at ? new Date(response.end_at) : undefined
    };
  }

  async deleteCourse(id: string): Promise<void> {
    await this.request(`courses/${id}`, 'DELETE');
  }

  async getUsers(courseId: string): Promise<User[]> {
    const response = await this.request<any[]>(`courses/${courseId}/users`, 'GET', {
      include: ['enrollments']
    });

    return response.map(user => ({
      id: user.id.toString(),
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: this.mapCanvasRoleToSDK(user.enrollments[0].role)
    }));
  }

  private mapCanvasRoleToSDK(role: string): User['role'] {
    switch (role.toLowerCase()) {
      case 'teacher':
      case 'instructor':
        return 'teacher';
      case 'student':
        return 'student';
      case 'admin':
      case 'administrator':
        return 'admin';
      default:
        return 'student';
    }
  }

  async getUserById(id: string): Promise<User> {
    const response = await this.request<any>(`users/${id}`);
    return {
      id: response.id.toString(),
      firstName: response.first_name,
      lastName: response.last_name,
      email: response.email,
      role: 'student' // Default role, actual role should be fetched from enrollment
    };
  }

  async enrollUser(courseId: string, userId: string, role: User['role']): Promise<void> {
    await this.request(`courses/${courseId}/enrollments`, 'POST', {
      enrollment: {
        user_id: userId,
        type: this.getCanvasEnrollmentType(role),
        enrollment_state: 'active'
      }
    });
  }

  private getCanvasEnrollmentType(role: User['role']): string {
    switch (role) {
      case 'teacher':
        return 'TeacherEnrollment';
      case 'student':
        return 'StudentEnrollment';
      case 'admin':
        return 'DesignerEnrollment';
      default:
        return 'StudentEnrollment';
    }
  }

  async getAssignments(courseId: string): Promise<Assignment[]> {
    const response = await this.request<any[]>(`courses/${courseId}/assignments`);
    return response.map(assignment => ({
      id: assignment.id.toString(),
      courseId: courseId,
      title: assignment.name,
      description: assignment.description,
      dueDate: assignment.due_at ? new Date(assignment.due_at) : undefined,
      maxScore: assignment.points_possible
    }));
  }

  async createAssignment(assignment: Omit<Assignment, 'id'>): Promise<Assignment> {
    const response = await this.request<any>(`courses/${assignment.courseId}/assignments`, 'POST', {
      assignment: {
        name: assignment.title,
        description: assignment.description,
        due_at: assignment.dueDate?.toISOString(),
        points_possible: assignment.maxScore
      }
    });

    return {
      id: response.id.toString(),
      courseId: assignment.courseId,
      title: response.name,
      description: response.description,
      dueDate: response.due_at ? new Date(response.due_at) : undefined,
      maxScore: response.points_possible
    };
  }

  async submitAssignment(assignmentId: string, userId: string, submission: any): Promise<void> {
    await this.request(`assignments/${assignmentId}/submissions`, 'POST', {
      submission: {
        user_id: userId,
        submission_type: 'online_text_entry',
        body: submission.text
      }
    });
  }
}