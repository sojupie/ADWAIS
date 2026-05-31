import { useState } from 'react';
import { CollectionPanel } from '../common/dashboard/CollectionPanel';

const SOCIAL_POSTS = [
  {
    id: 1,
    platform: 'LinkedIn',
    author: 'Motillo AB',
    time: '2 days ago',
    content: 'We\'re incredibly proud to announce that our work with Granngården has won the "E-commerce of the Year" award! Massive thanks to the entire team for pushing the boundaries of headless commerce and delivering exceptional digital experiences. 🏆🚀',
    visual: '🎉🏆',
    likes: 142,
    comments: 18,
    reposts: 5
  },
  {
    id: 2,
    platform: 'Instagram',
    author: 'Life at Motillo',
    time: '1 week ago',
    content: 'Awesome team-building day down by the lake! Nothing beats a Swedish summer BBQ with this crew. ☀️🍔',
    visual: '☀️🍔',
    likes: 89,
    comments: 4,
    reposts: 0
  },
  {
    id: 3,
    platform: 'LinkedIn',
    author: 'Motillo Tech',
    time: '2 weeks ago',
    content: 'New blog post: How we migrated 50M rows with zero downtime using our custom sync engine. Link in the comments below!',
    visual: '💻⚡',
    likes: 215,
    comments: 32,
    reposts: 45
  }
];

export function AgencySocialWall() {
  const [selectedPost, setSelectedPost] = useState(SOCIAL_POSTS[0]);

  return (
    <CollectionPanel 
      title="Agency Social Wall" 
      className="h-full relative"
      actions={
        <button className="bg-[#0077b5] text-white px-3 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-[#005e93] transition-all shadow-sm cursor-pointer">
          + Share Update
        </button>
      }
    >
      <div className="flex flex-col md:flex-row h-full overflow-hidden">
        {/* Sidebar List */}
        <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col overflow-y-auto custom-scrollbar bg-slate-50/50 min-h-0">
          {SOCIAL_POSTS.map(post => {
            const isSelected = selectedPost.id === post.id;
            return (
              <button 
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className={`flex flex-col text-left p-4 border-b border-slate-100 transition-colors cursor-pointer hover:bg-white ${isSelected ? 'bg-white border-l-4 border-l-brand-accent shadow-sm' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-5 h-5 rounded text-white flex items-center justify-center font-bold text-[9px] ${post.platform === 'LinkedIn' ? 'bg-[#0077b5]' : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500'}`}>
                    {post.platform === 'LinkedIn' ? 'in' : 'ig'}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{post.time}</span>
                </div>
                <p className="text-xs text-slate-700 font-medium line-clamp-2 leading-relaxed">
                  {post.content}
                </p>
              </button>
            );
          })}
        </div>

        {/* Detail View */}
        <div className="flex-1 flex flex-col p-6 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-3 mb-4 shrink-0">
            <div className={`w-10 h-10 rounded text-white flex items-center justify-center font-bold text-lg shadow-sm ${selectedPost.platform === 'LinkedIn' ? 'bg-[#0077b5]' : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500'}`}>
              {selectedPost.platform === 'LinkedIn' ? 'in' : 'ig'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900">{selectedPost.author}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{selectedPost.time} &bull; {selectedPost.platform}</span>
            </div>
          </div>
          
          <p className="text-sm text-slate-700 mb-6 leading-relaxed shrink-0">
            {selectedPost.content}
          </p>
          
          <div className="w-full flex-1 min-h-[150px] bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200 animate-in fade-in duration-300">
             <div className="absolute inset-0 bg-gradient-to-br from-brand-bg-secondary to-brand-btn-primary flex items-center justify-center">
               <span className="text-7xl drop-shadow-lg">{selectedPost.visual}</span>
             </div>
          </div>
          
          <div className="flex gap-6 mt-6 text-xs font-bold text-slate-500 border-t border-slate-100 pt-4 shrink-0">
            <span className="flex items-center gap-1.5"><span className="text-base">👍</span> {selectedPost.likes} Likes</span>
            <span className="flex items-center gap-1.5"><span className="text-base">💬</span> {selectedPost.comments} Comments</span>
            <span className="flex items-center gap-1.5"><span className="text-base">🔄</span> {selectedPost.reposts} {selectedPost.platform === 'LinkedIn' ? 'Reposts' : 'Shares'}</span>
          </div>
        </div>
      </div>
    </CollectionPanel>
  );
}
