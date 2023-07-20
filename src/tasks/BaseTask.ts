import prompts from "prompts";
import { TaskCommand } from "../models/Tasks";

export interface ITask {
  title: string;
  command: TaskCommand;
  run(): Promise<void>;
  confirm(message: string): Promise<any>;
}
export abstract class BaseTask implements ITask {
  readonly title: string;
  readonly command: TaskCommand;

  constructor(title: string, command: TaskCommand) {
    this.title = title;
    this.command = command;
  }

  async run(): Promise<void> { }

  async confirm(message: string): Promise<any> {
    const res = await prompts([
      {
        type: "confirm",
        name: "confirmed",
        initial: false,
        message: message || "Are you sure you want to continue?"
      }
    ]);
    return res.confirmed;
  }

  async reply(message: string): Promise<string> {
    const res = await prompts([{
      type: "text",
      name: "response",
      message: message,
    }]);
    return res.response;
  }

}