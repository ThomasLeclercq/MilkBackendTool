import * as dotenv from "dotenv";
import { EventEmitter } from "events";
import prompts from "prompts";
import { TaskCommand } from "../../models/Tasks";
import { BaseTask } from "../../tasks";
import { RefreshPassOrderUrls } from "../../tasks/RefreshPassOrderUrls";
import { TransferUserProjectTask } from "../../tasks/TransferUserProject";
import { TransferRestoredSpreads } from "../../tasks/TransferRestoredSpreads";
dotenv.config();

export class Cli {

  readonly choices: { title: string, value: TaskCommand }[] = [];
  private readonly _cli: EventEmitter = new EventEmitter();
  private readonly _tasks: BaseTask[] = [ new RefreshPassOrderUrls(), new TransferUserProjectTask(), new TransferRestoredSpreads() ];

  constructor() {
    for (const task of this._tasks) {
      this._cli.on(task.command, async () => await task.run());
      this.choices.push({
        title: task.title,
        value: task.command,
      })
    }
  }

  async run(): Promise<void> {
    const choice = await prompts({
      type: 'select',
      name: 'value',
      message: 'Choose task',
      choices: this.choices,
    })
    this._cli.emit(choice.value);
  }

  async exit(): Promise<void> {
    console.log('Exit');
    this._cli.removeAllListeners();
  }

}