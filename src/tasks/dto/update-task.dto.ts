import { TaskStatus } from "../task-status.enum";

export class UpdateTaskDto {
  status: TaskStatus;
  id: string;
}
