'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Zap, 
  Variable, 
  Code, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { emailTemplatesService, EmailTemplate } from '@/services/email-templates.service';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function EmailTemplateEditorPage({ params }: { params: Promise<{ key: string }> }) {
  const router = useRouter();
  const { key } = use(params);
  const isNew = key === 'new';

  const [form, setForm] = useState({
    key: isNew ? '' : key,
    subject: '',
    body: '',
    description: '',
    variables: ''
  });
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      emailTemplatesService.getOne(key).then((data: EmailTemplate) => {
        setForm({
          key: data.key,
          subject: data.subject,
          body: data.body,
          description: data.description || '',
          variables: data.variables ? JSON.stringify(JSON.parse(data.variables), null, 2) : ''
        });
        setLoading(false);
      }).catch((err: any) => {
        toast.error('Template not found');
        router.push('/admin/email-templates');
      });
    }
  }, [key, isNew, router]);

  // Live preview logic
  const updatePreview = useCallback(async (body: string, variablesStr: string) => {
    try {
      let vars = {};
      try {
        vars = variablesStr ? JSON.parse(variablesStr) : {};
      } catch (e) { /* ignore invalid json while typing */ }
      
      const rendered = await emailTemplatesService.getPreview(body, vars);
      setPreview(rendered);
    } catch (error) {
      console.error('Preview error', error);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (form.body) updatePreview(form.body, form.variables);
    }, 500);
    return () => clearTimeout(timeout);
  }, [form.body, form.variables, updatePreview]);

  const handleSave = async () => {
    if (!form.key || !form.subject || !form.body) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      let vars = null;
      if (form.variables) {
        try {
          vars = JSON.parse(form.variables);
        } catch (e) {
          toast.error('Invalid JSON in variables field');
          return;
        }
      }

      if (isNew) {
        await emailTemplatesService.create({ ...form, variables: vars });
        toast.success('Template created successfully');
      } else {
        await emailTemplatesService.update(key, { ...form, variables: vars });
        toast.success('Template updated successfully');
      }
      router.push('/admin/email-templates');
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center p-20 bg-black min-h-screen">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="bg-black min-h-screen flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-white/10 p-4 bg-slate-950 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/admin/email-templates" className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">Editor</span>
              <ChevronRight className="w-3 h-3 text-slate-700" />
              <span className="text-sm font-bold text-white">{isNew ? 'New Template' : form.key}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Auto-saving preview every 500ms</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
             onClick={() => router.push('/admin/email-templates')}
             className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Template</>}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden h-screen">
        {/* Left: Form */}
        <div className="w-1/2 p-8 overflow-y-auto border-r border-white/5 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2 block">Template Identity</label>
              <input 
                value={form.key}
                disabled={!isNew}
                onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                placeholder="VERIFICATION_CODE"
                className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all disabled:opacity-50 font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2 block">Email Subject</label>
              <input 
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Welcome to Protocol Arena!"
                className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2 block">Description (Optional)</label>
              <textarea 
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all h-20 resize-none"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Template Body (HTML)</label>
              <div className="flex items-center gap-2 bg-indigo-500/10 px-2 py-1 rounded-md">
                 <Code className="w-3 h-3 text-indigo-400" />
                 <span className="text-[10px] text-indigo-400 font-bold tracking-widest">HTML SUPPORTED</span>
              </div>
            </div>
            <textarea 
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all h-[400px] font-mono text-sm"
              placeholder="<h1>Hello {{name}}!</h1>"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-2">
               Test Variables (JSON) <Info className="w-3 h-3 text-slate-700" />
            </label>
            <textarea 
              value={form.variables}
              onChange={(e) => setForm({ ...form, variables: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all h-32 font-mono text-xs"
              placeholder='{ "name": "DeepMind", "code": "123456" }'
            />
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="w-1/2 bg-slate-950 p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-400" />
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">Real-time Preview</h3>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-full">
              <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Active</span>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-[32px] overflow-hidden shadow-2xl shadow-indigo-500/10 group relative">
            <div className="absolute inset-0 bg-slate-200/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="bg-slate-900 p-4 rounded-2xl text-white text-xs font-bold border border-white/10">
                 Final Email Projection
               </div>
            </div>
            <div 
              className="w-full h-full overflow-y-auto p-4"
              dangerouslySetInnerHTML={{ __html: preview || '<div class="flex items-center justify-center h-full text-slate-400 italic">No content rendered yet...</div>' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
