'use client';

import React, { useEffect, useState } from 'react';
import { 
  Mail, 
  Plus, 
  Search, 
  Settings, 
  Trash2, 
  Edit3, 
  Copy,
  Layout,
  Variable,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { emailTemplatesService, EmailTemplate } from '@/services/email-templates.service';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchTemplates = async () => {
    try {
      const data = await emailTemplatesService.getAll();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch templates', error);
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filteredTemplates = templates.filter(t => 
    t.key.toLowerCase().includes(search.toLowerCase()) || 
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (key: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await emailTemplatesService.delete(key);
      toast.success('Template deleted');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-[1400px] mx-auto bg-black min-h-screen text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
             Email Control <Mail className="w-8 h-8 text-indigo-500" />
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">Manage dynamic email communication across the platform</p>
        </div>
        <Link 
          href="/admin/email-templates/new"
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
        >
          <Plus className="w-5 h-5" /> New Template
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
          <input 
            type="text"
            placeholder="Search by key or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 font-medium"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 hover:border-indigo-500/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/10">
                    <Layout className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="flex gap-1">
                    <Link 
                      href={`/admin/email-templates/${template.key}`}
                      className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
                      title="Edit Template"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => handleDelete(template.key)}
                      className="p-2 hover:bg-rose-500/10 rounded-xl transition-colors text-slate-400 hover:text-rose-400"
                      title="Delete Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                    {template.key}
                  </span>
                  <h3 className="text-xl font-bold text-white leading-tight group-hover:text-indigo-400 transition-colors">
                    {template.subject}
                  </h3>
                  <p className="text-slate-500 text-sm line-clamp-2">
                    {template.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Variable className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs text-slate-500 font-medium">Dynamic Variables</span>
                  </div>
                  <Link 
                    href={`/admin/email-templates/${template.key}`}
                    className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-indigo-400 transition-colors"
                  >
                    Manage Editor <Eye className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredTemplates.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center bg-slate-900/30 border border-dashed border-white/10 rounded-[40px]">
              <Mail className="w-16 h-16 text-slate-800 mx-auto mb-4" />
              <p className="text-slate-500 font-bold">No templates found matching your search.</p>
              <button 
                onClick={() => setSearch('')}
                className="mt-4 text-indigo-400 text-sm font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
