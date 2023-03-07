export interface Gauge {
  inc(value: number): void;
  dec(value: number): void;
}

export class WaitGroup {
  private tasks: Map<Promise<void>, never>;
  private gauge?: Gauge;

  constructor(
    private limit: number,
  ) {
    this.tasks = new Map<Promise<void>, never>();
  }

  static withGauge(limit: number, gauge: Gauge): WaitGroup {
    const wg = new WaitGroup(limit);
    wg.gauge = gauge;

    return wg;
  }

  public async go(action: () => Promise<void>): Promise<void> {
    if (this.tasks.size === this.limit) {
      await Promise.race(this.tasks.keys());
    }

    const task = action();

    this.tasks.set(task, {} as never);
    this.gauge?.inc(1);
    task.finally(() => {
      this.tasks.delete(task);
      this.gauge?.dec(1);
    });
  }

  public async wait(): Promise<void> {
    await Promise.all(this.tasks.keys());
  }
}
