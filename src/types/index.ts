export interface LMSConfig {
  type: 'moodle' | 'canvas' | 'blackboard';
  baseUrl: string;
  apiKey?: string;
  credentials?: {
    username: string;
    password: string;
  };
  providerConfig?: {
    // Moodle specific
    tokenService?: string;
    restFormat?: string;
    // Canvas specific
    apiVersion?: string;
    accountId?: string;
    // Blackboard specific
    domain?: string;
    appKey?: string;
    appSecret?: string;
  };
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  maxScore?: number;
}

export interface LMSProvider {
  getCourses(): Promise<Course[]>;
  getCourseById(id: string): Promise<Course>;
  createCourse(course: Omit<Course, 'id'>): Promise<Course>;
  updateCourse(id: string, course: Partial<Course>): Promise<Course>;
  deleteCourse(id: string): Promise<void>;
  
  getUsers(courseId: string): Promise<User[]>;
  getUserById(id: string): Promise<User>;
  enrollUser(courseId: string, userId: string, role: User['role']): Promise<void>;
  
  getAssignments(courseId: string): Promise<Assignment[]>;
  createAssignment(assignment: Omit<Assignment, 'id'>): Promise<Assignment>;
  submitAssignment(assignmentId: string, userId: string, submission: any): Promise<void>;
}