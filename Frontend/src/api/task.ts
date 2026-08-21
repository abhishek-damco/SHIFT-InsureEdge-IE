import api from './client';

export type TaskListItemDto = {
  id:               number;
  taskCode:         string;
  taskType:         string | null;
  taskHeading:      string | null;
  taskPriority:     string | null;
  status:           string;
  taskDueDate:      string | null;
  assignedTo:       number | null;
  assigneeUserName: string | null;
};

export type TaskTypeCountDto = {
  claimEscalation: number;
  riskSurvey:      number;
  underwriting:    number;
  customerService: number;
  legalCompliance: number;
  fraudSiu:        number;
};

export type TaskAssigneeDto = {
  id:       number;
  fullName: string;
  initials: string;
};

export type TaskDocumentDto = {
  id:          number;
  fileName:    string;
  contentType: string | null;
  fileSize:    number | null;
  createdOn:   string;
};

export type TaskDetailDto = {
  id:               number;
  claimId:          number;
  taskCode:         string;
  taskType:         string | null;
  taskHeading:      string | null;
  taskDescription:  string | null;
  status:           string;
  taskPriority:     string | null;
  taskDueDate:      string | null;
  completionDate:   string | null;
  followUpDate:     string | null;
  assignedTo:       number | null;
  assigneeUserName: string | null;
  comments:         string | null;
  createdOn:        string;
  documents:        TaskDocumentDto[];
};

export type TaskTimelineDto = {
  id:           number;
  date:         string;
  activityType: string;
  transactionId:string;
  updatedBy:    string;
  description:  string;
  timestamp:    string;
};

export type CreateOrUpdateTaskRequest = {
  id:              number | null;
  claimId:         number;
  taskType:        string | null;
  taskHeading:     string | null;
  taskDescription: string | null;
  taskPriority:    string | null;
  taskDueDate:     string | null;
  completionDate:  string | null;
  followUpDate:    string | null;
  assignedTo:      number | null;
  comments:        string | null;
  status:          string | null;
};

export type TaskDocumentUploadRequest = {
  fileName:          string;
  contentType:       string | null;
  fileSize:          number | null;
  fileContentBase64: string | null;
};

export const taskApi = {
  getByType: (claimId: number, taskType: string) =>
    api.get<TaskListItemDto[]>(`/tasks/by-claim/${claimId}`, { params: { taskType } }).then(r => r.data),

  getCounts: (claimId: number) =>
    api.get<TaskTypeCountDto>(`/tasks/by-claim/${claimId}/count`).then(r => r.data),

  getTimeline: (claimId: number) =>
    api.get<TaskTimelineDto[]>(`/tasks/by-claim/${claimId}/timeline`).then(r => r.data),

  getAssignees: () =>
    api.get<TaskAssigneeDto[]>('/tasks/assignees').then(r => r.data),

  getDetail: (taskId: number) =>
    api.get<TaskDetailDto>(`/tasks/${taskId}`).then(r => r.data),

  createOrUpdate: (req: CreateOrUpdateTaskRequest) =>
    api.post<{ id: number }>('/tasks', req).then(r => r.data),

  uploadDocument: (taskId: number, req: TaskDocumentUploadRequest) =>
    api.post<TaskDocumentDto>(`/tasks/${taskId}/documents`, req).then(r => r.data),

  getDocumentUrl: (taskId: number, documentId: number) =>
    `/api/tasks/${taskId}/documents/${documentId}`,
};
