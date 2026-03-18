export const api = {
  async get(entity: string) {
    const res = await fetch(`/api/${entity}`);
    if (!res.ok) throw new Error(`Failed to fetch ${entity}`);
    return res.json();
  },
  async save(entity: string, data: any) {
    const res = await fetch(`/api/${entity}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to save ${entity}`);
    return res.json();
  },
  async delete(entity: string, id: string) {
    const res = await fetch(`/api/${entity}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete ${entity}`);
    return res.json();
  },
  async bulkSave(entity: string, data: any[]) {
    const res = await fetch(`/api/bulk/${entity}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to bulk save ${entity}`);
    return res.json();
  }
};
