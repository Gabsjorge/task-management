import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus } from './task-status.enum';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { User } from 'src/auth/user.entity';
import { InternalServerErrorException, Logger } from '@nestjs/common';

// Note: On previous versions of typeorm lib, we must use the EntityRepository decorator
// Now it is deprecated, and you can inject directly at the constructor
// For cleaner code purposes, a Repository file was created, and get the injection on this
// class instead, and then provide this class at the Task Module
export class TasksRepository extends Repository<Task> {
  private logger = new Logger('TasksRepository', { timestamp: true });

  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {
    super(tasksRepository.target, tasksRepository.manager, tasksRepository.queryRunner);
  }

  async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    const { status, search } = filterDto;

    const query = this.tasksRepository.createQueryBuilder('task');
    query.where({ user });

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (search) {
      query.andWhere('(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search))', {
        search: `%${search}%`,
      });
    }

    try {
      const tasks = await query.getMany();
      return tasks;
    } catch (error) {
      this.logger.error(
        `Failed to get tasks for user "${user.username}". Filters: ${JSON.stringify(filterDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const { title, description } = createTaskDto;

    const task = this.tasksRepository.create({
      title,
      description,
      status: TaskStatus.OPEN,
      user,
    });

    try {
      await this.tasksRepository.save(task);
      return task;
    } catch (error) {
      this.logger.error(
        `Failed to create task for user "${user.username}". Data: ${JSON.stringify(createTaskDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }
}
