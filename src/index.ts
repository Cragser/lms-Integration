import { LMSConfig, LMSProvider } from './types';
import { MoodleProvider } from './providers/moodle';
import { CanvasProvider } from './providers/canvas';
import { BlackboardProvider } from './providers/blackboard';
import { loadConfig } from './config';

export class LMS {
  private providers: Map<string, LMSProvider>;

  constructor() {
    const configs = loadConfig();
    this.providers = new Map();
    
    for (const [name, config] of Object.entries(configs)) {
      this.providers.set(name, this.createProvider(config));
    }
  }

  private createProvider(config: LMSConfig): LMSProvider {
    switch (config.type) {
      case 'moodle':
        return new MoodleProvider(config);
      case 'canvas':
        return new CanvasProvider(config);
      case 'blackboard':
        return new BlackboardProvider(config);
      default:
        throw new Error(`Unsupported LMS type: ${config.type}`);
    }
  }

  // Get a specific provider by name
  public getProvider(name: string): LMSProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider not found: ${name}`);
    }
    return provider;
  }

  // Get all available provider names
  public getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }

  // Expose all provider methods through the main LMS class with provider selection
  public getCourses(providerName: string) {
    return this.getProvider(providerName).getCourses();
  }

  public getCourseById(providerName: string, id: string) {
    return this.getProvider(providerName).getCourseById(id);
  }

  public createCourse(providerName: string, course: Parameters<LMSProvider['createCourse']>[0]) {
    return this.getProvider(providerName).createCourse(course);
  }

  public updateCourse(providerName: string, id: string, course: Parameters<LMSProvider['updateCourse']>[1]) {
    return this.getProvider(providerName).updateCourse(id, course);
  }

  public deleteCourse(providerName: string, id: string) {
    return this.getProvider(providerName).deleteCourse(id);
  }

  public getUsers(providerName: string, courseId: string) {
    return this.getProvider(providerName).getUsers(courseId);
  }

  public getUserById(providerName: string, id: string) {
    return this.getProvider(providerName).getUserById(id);
  }

  public enrollUser(providerName: string, courseId: string, userId: string, role: Parameters<LMSProvider['enrollUser']>[2]) {
    return this.getProvider(providerName).enrollUser(courseId, userId, role);
  }

  public getAssignments(providerName: string, courseId: string) {
    return this.getProvider(providerName).getAssignments(courseId);
  }

  public createAssignment(providerName: string, assignment: Parameters<LMSProvider['createAssignment']>[0]) {
    return this.getProvider(providerName).createAssignment(assignment);
  }

  public submitAssignment(providerName: string, assignmentId: string, userId: string, submission: any) {
    return this.getProvider(providerName).submitAssignment(assignmentId, userId, submission);
  }
}