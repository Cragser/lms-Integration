import axios from 'axios';
import { LMSConfig, LMSProvider, Course, User, Assignment } from '../types';

export class BlackboardProvider implements LMSProvider {
  private baseUrl: string;
  private apiKey?: string;
  private credentials?: LMSConfig['credentials'];

  constructor(config: LMSConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.credentials = config.credentials;
  }

  private async request<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any): Promise<T> {
    const url = `${this.baseUrl}/learn/api/public/v1/${endpoint}`;
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
    const response = await this.request<any>('courses');
    return response.results.map((course: any) => ({
      id: course.id,
      name: course.name,
      description: course.description,
      startDate: course.availability.available ? new Date(course.availability.start) : undefined,
      endDate: course.availability.available ? new Date(course.availability.end) : undefined
    }));
  }

  async getCourseById(id: string): Promise<Course> {
    const response = await this.request<any>(`courses/${id}`);
    return {
      id: response.id,
      name: response.name,
      description: response.description,
      startDate: response.availability.available ? new Date(response.availability.start) : undefined,
      endDate: response.availability.available ? new Date(response.availability.end) : undefined
    };
  }

  async createCourse(course: Omit<Course, 'id'>): Promise<Course> {
    const response = await this.request<any>('courses', 'POST', {
      name: course.name,
      description: course.description,
      availability: {
        available: true,
        start: course.startDate?.toISOString(),
        end: course.endDate?.toISOString()
      }
    });

    return {
      id: response.id,
      name: response.name,
      description: response.description,
      startDate: response.availability.available ? new Date(response.availability.start) : undefined,
      endDate: response.availability.available ? new Date(response.availability.end) : undefined
    };
  }

  async updateCourse(id: string, course: Partial<Course>): Promise<Course> {
    const response = await this.request<any>(`courses/${id}`, 'PATCH', {
      name: course.name,
      description: course.description,
      availability: {
        available: true,
        start: course.startDate?.toISOString(),
        end: course.endDate?.toISOString()
      }
    });

    return {
      id: response.id,
      name: response.name,
      description: response.description,
      startDate: response.availability.available ? new Date(response.availability.start) : undefined,
      endDate: response.availability.available ? new Date(response.availability.end) : undefined
    };
  }

  async deleteCourse(id: string): Promise<void> {
    await this.request(`courses/${id}`, 'DELETE');
  }

  async getUsers(courseId: string): Promise<User[]> {
    const response = await this.request<any>(`courses/${courseId}/users`);
    return response.results.map((user: any) => ({
      id: user.userId,
      firstName: user.name.given,
      lastName: user.name.family,
      email: user.contact.email,
      role: this.mapBlackboardRoleToSDK(user.courseRoleId)
    }));
  }

  private mapBlackboardRoleToSDK(role: string): User['role'] {
    switch (role) {
      case 'Instructor':
        return 'teacher';
      case 'Student':
        return 'student';
      case 'Administrator':
        return 'admin';
      default:
        return 'student';
    }
  }

  async getUserById(id: string): Promise<User> {
    const response = await this.request<any>(`users/${id}`);
    return {
      id: response.userId,
      firstName: response.name.given,
      lastName: response.name.family,
      email: response.contact.email,
      role: 'student' // Default role, actual role should be fetched from enrollment
    };
  }

  async enrollUser(courseId: string, userId: string, role: User['role']): Promise<void> {
    await this.request(`courses/${courseId}/users`, 'POST', {
      userId: userId,
      courseRoleId: this.getBlackboardRoleId(role)
    });
  }

  private getBlackboardRoleId(role: User['role']): string {
    switch (role) {
      case 'teacher':
        return 'Instructor';
      case 'student':
        return 'Student';
      case 'admin':
        return 'Administrator';
      default:
        return 'Student';
    }
  }

  async getAssignments(courseId: string): Promise<Assignment[]> {
    const response = await this.request<any>(`courses/${courseId}/contents`);
    return response.results
      .filter((content: any) => content.contentHandler.id === 'resource/x-bb-assignment')
      .map((assignment: any) => ({
        id: assignment.id,
        courseId: courseId,
        title: assignment.title,
        description: assignment.body,
        dueDate: assignment.availability.end ? new Date(assignment.availability.end) : undefined,
        maxScore: assignment.grading?.score?.possible
      }));
  }

  async createAssignment(assignment: Omit<Assignment, 'id'>): Promise<Assignment> {
    const response = await this.request<any>(`courses/${assignment.courseId}/contents`, 'POST', {
      title: assignment.title,
      body: assignment.description,
      availability: {
        available: true,
        allowGuests: false,
        adaptiveRelease: {},
        end: assignment.dueDate?.toISOString()
      },
      contentHandler: {
        id: 'resource/x-bb-assignment'
      },
      grading: {
        score: {
          possible: assignment.maxScore
        }
      }
    });

    return {
      id: response.id,
      courseId: assignment.courseId,
      title: response.title,
      description: response.body,
      dueDate: response.availability.end ? new Date(response.availability.end) : undefined,
      maxScore: response.grading?.score?.possible
    };
  }

  async submitAssignment(assignmentId: string, userId: string, submission: any): Promise<void> {
    await this.request(`contents/${assignmentId}/attempts`, 'POST', {
      userId: userId,
      text: submission.text
    });
  }
}