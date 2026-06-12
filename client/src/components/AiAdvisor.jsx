import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const impactColors = {
  high: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
  medium: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
  low: 'bg-surface-500/20 text-surface-300 border-surface-500/30',
};

const urgencyColors = {
  now: 'bg-danger-500/20 text-danger-400',
  today: 'bg-warning-500/20 text-warning-400',
  this_week: 'bg-primary-500/20 text-primary-300',
};

const typeIcons = {
  shortlist: '⭐',
  interview: '📅',
  review: '🔍',
  reach_out: '📧',
  create_job: '💼',
};

function ThinkingDots() {
  return (
    <span className="inline-flex gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
    </span>
  );
}

export default function AiAdvisor({ onAction }) {
  const [mode, setMode] = useState('advise');
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [chat, setChat] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [selectedTab, setSelectedTab] = useState('actions');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const getAdvice = async () => {
    setLoading(true);
    setAdvice(null);
    try {
      const res = await axios.post('/api/ai/advise');
      setAdvice(res.data.advice);
      setExpanded(true);
    } catch (err) {
      setAdvice({ summary: 'AI service unavailable. Please check your API key and server connection.', pipelineHealth: 'attention_needed', priorityActions: [], recommendations: [], insights: [] });
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async (e) => {
    e.preventDefault();
    if (!chatMsg.trim() || chatLoading) return;
    const userMsg = chatMsg;
    setChatMsg('');
    setChat((p) => [...p, { role: 'user', text: userMsg }]);
    setChatLoading(true);
    try {
      const res = await axios.post('/api/ai/chat', { message: userMsg });
      setChat((p) => [...p, { role: 'ai', text: res.data.reply }]);
    } catch (err) {
      setChat((p) => [...p, { role: 'ai', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={getAdvice}
        disabled={loading}
        className="w-full glass-card p-4 hover:bg-white/[0.08] transition-all group text-left active:scale-[0.99] relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary-500/10 rounded-full blur-[30px] group-hover:bg-primary-500/20 transition-all" />
        <div className="relative flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-xl shadow-lg ${loading ? 'animate-pulse' : 'group-hover:scale-110'} transition-transform`}>
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '🧠'}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white group-hover:text-primary-300 transition-colors">AI Recruitment Advisor</p>
            <p className="text-xs text-surface-400">{loading ? 'Analyzing your pipeline...' : 'Get AI-powered insights & recommendations'}</p>
          </div>
          {!loading && <svg className="w-4 h-4 text-surface-500 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>}
        </div>
      </button>
    );
  }

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-sm shadow-lg">🧠</div>
          <div>
            <p className="text-sm font-semibold text-white">AI Advisor</p>
            <p className="text-[10px] text-surface-500">Powered by Gemini 2.5</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => { setMode('advise'); getAdvice(); }} className={`text-xs px-2.5 py-1.5 rounded-lg transition-all ${mode === 'advise' ? 'bg-primary-500/20 text-primary-300' : 'text-surface-400 hover:text-white'}`}>Advise</button>
          <button onClick={() => setMode('chat')} className={`text-xs px-2.5 py-1.5 rounded-lg transition-all ${mode === 'chat' ? 'bg-primary-500/20 text-primary-300' : 'text-surface-400 hover:text-white'}`}>Chat</button>
          <button onClick={() => setExpanded(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-surface-400 hover:text-white transition-all ml-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {mode === 'advise' && (
        <div className="p-4 max-h-[500px] overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-surface-400">
              <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium text-surface-300">AI is analyzing your recruitment pipeline...</p>
              <p className="text-xs mt-1">Gathering data, identifying patterns, generating recommendations</p>
            </div>
          ) : advice ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className={`p-3 rounded-xl border ${
                advice.pipelineHealth === 'healthy' ? 'bg-success-500/10 border-success-500/20' :
                advice.pipelineHealth === 'critical' ? 'bg-danger-500/10 border-danger-500/20' :
                'bg-warning-500/10 border-warning-500/20'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${
                    advice.pipelineHealth === 'healthy' ? 'bg-success-500' :
                    advice.pipelineHealth === 'critical' ? 'bg-danger-500' : 'bg-warning-500'
                  }`} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-surface-400">
                    Pipeline {advice.pipelineHealth?.replace('_', ' ')}
                  </span>
                  {advice.pipelineScore && (
                    <span className="text-xs font-bold ml-auto">{advice.pipelineScore}/100</span>
                  )}
                </div>
                <p className="text-sm text-surface-300 leading-relaxed">{advice.summary}</p>
              </div>

              {/* Tab bar */}
              <div className="flex gap-1 border-b border-white/[0.06] pb-2">
                {[
                  { key: 'actions', label: `Actions (${advice.priorityActions?.length || 0})` },
                  { key: 'recommendations', label: `Recommend (${advice.recommendations?.length || 0})` },
                  { key: 'insights', label: `Insights (${advice.insights?.length || 0})` },
                  { key: 'bottlenecks', label: `Issues (${advice.bottlenecks?.length || 0})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedTab(tab.key)}
                    className={`text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-all ${
                      selectedTab === tab.key ? 'bg-primary-500/20 text-primary-300' : 'text-surface-500 hover:text-surface-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Priority Actions */}
              {selectedTab === 'actions' && advice.priorityActions && (
                <div className="space-y-2">
                  {advice.priorityActions.length === 0 && <p className="text-xs text-surface-500 py-4 text-center">No priority actions identified</p>}
                  {advice.priorityActions.map((item, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-white">{item.action}</p>
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${impactColors[item.impact] || impactColors.low}`}>
                          {item.impact}
                        </span>
                      </div>
                      <p className="text-xs text-surface-400 mb-1">{item.reason}</p>
                      {item.suggestion && <p className="text-[11px] text-primary-300/80 italic">{item.suggestion}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {selectedTab === 'recommendations' && advice.recommendations && (
                <div className="space-y-2">
                  {advice.recommendations.length === 0 && <p className="text-xs text-surface-500 py-4 text-center">No specific recommendations yet</p>}
                  {advice.recommendations.map((rec, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{typeIcons[rec.type] || '💡'}</span>
                        <p className="text-sm font-medium text-white">{rec.title}</p>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ml-auto ${urgencyColors[rec.urgency] || 'bg-surface-500/20 text-surface-400'}`}>
                          {rec.urgency?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-surface-400">{rec.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Insights */}
              {selectedTab === 'insights' && advice.insights && (
                <div className="space-y-2">
                  {advice.insights.length === 0 && <p className="text-xs text-surface-500 py-4 text-center">No insights generated</p>}
                  {advice.insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-sm flex-shrink-0 mt-0.5">📊</span>
                      <p className="text-xs text-surface-300">{insight}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottlenecks */}
              {selectedTab === 'bottlenecks' && advice.bottlenecks && (
                <div className="space-y-2">
                  {advice.bottlenecks.length === 0 && <p className="text-xs text-surface-500 py-4 text-center">No bottlenecks detected</p>}
                  {advice.bottlenecks.map((b, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-danger-500/5 border border-danger-500/10">
                      <span className="text-sm flex-shrink-0 mt-0.5">🚧</span>
                      <p className="text-xs text-surface-300">{b}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Actions */}
              {advice.quickActions && advice.quickActions.length > 0 && (
                <div className="pt-2 border-t border-white/[0.06]">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-500 mb-2">Suggested Quick Actions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {advice.quickActions.map((qa, i) => (
                      <button
                        key={i}
                        onClick={() => onAction?.(qa.type)}
                        className="text-[10px] font-medium px-2.5 py-1.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30 hover:bg-primary-500/30 transition-all"
                      >
                        {qa.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={getAdvice} className="w-full text-xs text-primary-400 hover:text-primary-300 py-2 transition-colors flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
                Refresh Analysis
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Chat Mode */}
      {mode === 'chat' && (
        <div className="flex flex-col h-[400px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {chat.length === 0 && (
              <div className="text-center py-12">
                <div className="text-3xl mb-3">💬</div>
                <p className="text-sm text-surface-400 mb-1">Ask anything about your recruitment</p>
                <p className="text-xs text-surface-500">Examples: "Who should I interview today?" "How many candidates in pipeline?" "Any strong applicants?"</p>
              </div>
            )}
            {chat.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'ai' && <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">🧠</div>}
                <div className={`max-w-[80%] p-3 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'user' ? 'bg-primary-500/20 text-white border border-primary-500/30' : 'bg-white/5 text-surface-300 border border-white/10'
                }`}>
                  {msg.text}
                </div>
                {msg.role === 'user' && <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">U</div>}
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-xs flex-shrink-0">🧠</div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <ThinkingDots />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={sendChat} className="p-3 border-t border-white/[0.06] flex gap-2">
            <input
              type="text"
              value={chatMsg}
              onChange={(e) => setChatMsg(e.target.value)}
              placeholder="Ask the AI advisor anything..."
              className="input-field flex-1 text-sm"
              disabled={chatLoading}
            />
            <button
              type="submit"
              disabled={!chatMsg.trim() || chatLoading}
              className="btn-primary px-3 flex items-center justify-center disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
