import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus } from './task-status.enum';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';

export class TasksRepository extends Repository<Task> {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {
    super(tasksRepository.target, tasksRepository.manager, tasksRepository.queryRunner);
  }

  async getTasks(filterDto: GetTasksFilterDto): Promise<Task[]> {
    const { status, search } = filterDto;

    const query = this.tasksRepository.createQueryBuilder('task');

    if (status) {
      query.where('task.status = :status', { status });
    }

    if (search) {
      query
        .where('LOWER(task.title) LIKE LOWER(:search)', { search: `%${search}%` })
        .orWhere('LOWER(task.description) LIKE LOWER(:search)', { search: `%${search}%` });
    }

    const tasks = await query.getMany();
    return tasks;
  }

  async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
    const { title, description } = createTaskDto;

    const task = this.tasksRepository.create({
      title,
      description,
      status: TaskStatus.OPEN,
    });

    await this.tasksRepository.save(task);
    return task;
  }
}
