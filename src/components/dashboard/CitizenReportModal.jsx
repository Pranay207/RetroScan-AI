import { useState } from 'react';
import { X, MapPin, Upload, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HIGHWAYS = ['NH-44', 'NH-48', 'NH-8', 'NH-19', 'NH-27', 'NH-16', 'NH-52', 'NH-30', 'NH-66', 'NH-58'];
const ISSUE_TYPES = ['Faded Sign', 'Missing Marking', 'Broken Stud', 'Damaged Delineator', 'Other'];

function genRef() {
  return 'RPT-2024-' + Math.floor(1000 + Math.random() * 9000);
}

export default function CitizenReportModal({ onClose }) {
  const [form, setForm] = useState({ highway: '', location: '', issue: '', severity: '', photo: null });
  const [submitted, setSubmitted] = useState(false);
  const [refId] = useState(genRef());

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#FF6B00] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <MapPin size={18} />
            <span className="font-rajdhani font-bold text-lg">Report Unsafe Sign</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Highway *</label>
                <select
                  required
                  value={form.highway}
                  onChange={e => setForm(f => ({ ...f, highway: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 bg-gray-50"
                >
                  <option value="">Select highway…</option>
                  {HIGHWAYS.map(h => <option key={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Location Description *</label>
                <input
                  required
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Near Nagpur toll plaza, km 847"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 bg-gray-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Issue Type *</label>
                <select
                  required
                  value={form.issue}
                  onChange={e => setForm(f => ({ ...f, issue: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 bg-gray-50"
                >
                  <option value="">Select issue…</option>
                  {ISSUE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Severity *</label>
                <div className="flex gap-3">
                  {['Low', 'Medium', 'Critical'].map(s => (
                    <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="severity"
                        value={s}
                        checked={form.severity === s}
                        onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                        required
                        className="accent-[#FF6B00]"
                      />
                      <span className={`text-xs font-medium ${s === 'Critical' ? 'text-red-600' : s === 'Medium' ? 'text-yellow-600' : 'text-green-600'}`}>{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Photo (Optional)</label>
                <label className="flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-[#FF6B00]/40 transition-colors">
                  <Upload size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{form.photo ? form.photo.name : 'Click to upload image'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => setForm(f => ({ ...f, photo: e.target.files[0] }))} />
                </label>
              </div>

              <Button type="submit" className="w-full bg-[#FF6B00] hover:bg-[#e55f00] text-white font-semibold rounded-xl py-5">
                Submit Report
              </Button>
            </form>
          ) : (
            <div className="text-center py-6">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
              <h3 className="font-rajdhani font-bold text-xl text-gray-800 mb-2">Report Submitted!</h3>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                <p className="text-xs text-green-700 font-mono font-bold">Reference ID: {refId}</p>
              </div>
              <p className="text-sm text-gray-500 mb-5">NHAI maintenance team has been notified. You will receive an update within 48 hours.</p>
              <Button onClick={onClose} className="bg-[#FF6B00] hover:bg-[#e55f00] text-white rounded-xl px-6">Close</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}