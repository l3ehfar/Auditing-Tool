import { type Service, type DataStore, type ObjectId } from '@marcellejs/core';

export class Questionnaire<T extends { submitted: boolean; id: ObjectId }> {
  service: Service<T>;
  id: ObjectId | null = null;

  constructor(store: DataStore, serviceName: string) {
    this.service = store.service<T>(serviceName);
    store.connect().then(() => {
      this.retrieve();
    });
  }

  async record(answers: Partial<T>) {
    if (this.id) {
      const res = await this.service.patch(this.id, answers);
    } else {
      const res = await this.service.create({ submitted: false, ...answers });
      this.id = res.id;
    }
  }

  async submit() {
    return this.service.patch(this.id, { submitted: true } as Partial<T>);
  }

  async retrieve(): Promise<Partial<T>> {
    const latest = await this.service
      .items()
      .query({ $sort: { updatedAt: -1 } })
      .take(1)
      .toArray();
    if (latest.length) {
      this.id = latest[0].id;
      return latest[0];
    }
    return {};
  }
}
