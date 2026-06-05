import api from '@/lib/api';

export interface EmailTemplate {
  id: string;
  key: string;
  subject: string;
  body: string;
  description?: string;
  variables?: string; // JSON string
  createdAt: string;
  updatedAt: string;
}

export const emailTemplatesService = {
  getAll: async (): Promise<EmailTemplate[]> => {
    const response = await api.get('/email-templates');
    return response.data;
  },

  getOne: async (key: string): Promise<EmailTemplate> => {
    const response = await api.get(`/email-templates/${key}`);
    return response.data;
  },

  create: async (data: any): Promise<EmailTemplate> => {
    const response = await api.post('/email-templates', data);
    return response.data;
  },

  update: async (key: string, data: any): Promise<EmailTemplate> => {
    const response = await api.put(`/email-templates/${key}`, data);
    return response.data;
  },

  delete: async (key: string): Promise<void> => {
    await api.delete(`/email-templates/${key}`);
  },

  getPreview: async (body: string, variables: any = {}): Promise<string> => {
    const response = await api.post('/email-templates/preview', { body, variables });
    return response.data.rendered;
  },
};
