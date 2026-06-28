import React, { useState } from 'react';
import { Shield, Database, Layout, GitBranch, Briefcase, ChevronRight, Code, Server, UserCheck, Key, Zap, CheckCircle, Terminal } from 'lucide-react';

interface ExpertInsightsProps {
  language: 'en' | 'si';
}

export const ExpertInsights: React.FC<ExpertInsightsProps> = ({ language }) => {
  const [activeRole, setActiveRole] = useState<'architect' | 'designer' | 'database' | 'security' | 'product'>('architect');
  const [selectedQuery, setSelectedQuery] = useState<string>('q1');
  const [queryRunning, setQueryRunning] = useState(false);

  const roles = [
    {
      id: 'architect' as const,
      name: language === 'en' ? 'Senior Software Architect' : 'Senior Software Architect (ප්‍රධාන මෘදුකාංග ව්‍යූහය හදන කෙනෙක්)',
      icon: GitBranch,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      activeColor: 'bg-blue-600 border-blue-500 text-white',
      tagline: language === 'en' ? 'Designing scalable, multi-channel state synchronization.' : 'පරිමාණ කළ හැකි, බහු-නාලිකා දත්ත සමමුහුර්තකරණ සැලසුම.',
    },
    {
      id: 'designer' as const,
      name: language === 'en' ? 'UI/UX Designer' : 'UI/UX Designer (පෙනුම සහ භාවිතයට පහසු වෙන විදියට ඩිසයින් කරන කෙනෙක්)',
      icon: Layout,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      activeColor: 'bg-emerald-600 border-emerald-500 text-white',
      tagline: language === 'en' ? 'Crafting fluid bilingual touch-first POS and customer storefront.' : 'ද්විභාෂා ස්පර්ශ සංවේදී POS සහ පාරිභෝගික අතුරුමුහුණත.',
    },
    {
      id: 'database' as const,
      name: language === 'en' ? 'Database Engineer' : 'Database Engineer (දත්ත ගබඩා කිරීමේ තාක්ෂණය ගැන විශේෂඥයෙක්)',
      icon: Database,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      activeColor: 'bg-amber-600 border-amber-500 text-white',
      tagline: language === 'en' ? 'Relational schema optimized for fast customer-repair lookups.' : 'වේගවත් සෙවුම් සඳහා ප්‍රශස්ත කරන ලද දත්ත පද්ධතිය.',
    },
    {
      id: 'security' as const,
      name: language === 'en' ? 'Cybersecurity Specialist' : 'Cybersecurity Specialist (හැකර්වරුන්ගෙන් බේරිලා ආරක්ෂිතව සිස්ටම් එක හදන කෙනෙක්)',
      icon: Shield,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      activeColor: 'bg-rose-600 border-rose-500 text-white',
      tagline: language === 'en' ? 'Securing transactions, sanitizing inputs, and local encryption.' : 'ගනුදෙනු සුරක්ෂිත කිරීම, දත්ත පිරිසිදු කිරීම සහ සංකේතනය.',
    },
    {
      id: 'product' as const,
      name: language === 'en' ? 'Product Manager' : 'Product Manager (මුළු වැඩේම කළමනාකරණය කරන කෙනෙක්)',
      icon: Briefcase,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      activeColor: 'bg-indigo-600 border-indigo-500 text-white',
      tagline: language === 'en' ? 'Maximizing retail-wholesale synergy and 24h operational uptime.' : 'තොග-සිල්ලර ආදායම් වර්ධනය සහ පැය 24 සේවා අඛණ්ඩතාවය.',
    }
  ];

  const renderContent = () => {
    switch (activeRole) {
      case 'architect':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Code className="h-6 w-6 text-blue-500" />
              <h3 className="text-xl font-bold text-slate-100">
                {language === 'en' ? 'System Architecture & Sync Strategy' : 'පද්ධති ව්‍යුහය සහ දත්ත සමමුහුර්තකරණය (Senior Software Architect)'}
              </h3>
            </div>
            
            <p className="text-slate-300 leading-relaxed text-sm">
              {language === 'en' 
                ? "To solve the client's core problem—having sales from both the physical shop (POS) and the online store reduce from the exact same stock in real-time—we implemented a Unified State Controller pattern. Whether an item is purchased via the customer's mobile phone at 3 AM or sold at the counter at 10 AM, both channels invoke a centralized state transition engine."
                : "පාරිභෝගිකයාගේ ප්‍රධාන ගැටලුව වන - භෞතික වෙළඳසැලෙන් (POS) සහ සබැඳි වෙළඳසැලෙන් (Online Store) සිදුවන විකුණුම් එකම තොගයකින් තත්කාලීනව (real-time) අඩු කිරීම සඳහා - අපි 'එක්සත් තත්ත්ව පාලක' (Unified State Controller) රටාව භාවිතා කළෙමු."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl">
                <h4 className="text-sm font-semibold text-blue-400 mb-2">⚡ {language === 'en' ? 'Real-Time System Telemetry' : 'තත්කාලීන පද්ධති ටෙලිමෙට්‍රි'}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'en'
                    ? "Monitors active CPU load, heap memory footprint, and DB read/write response speeds directly on the Dashboard, giving administrators full visibility into the runtime performance."
                    : "පද්ධතියේ සජීවී CPU ධාරිතාව, මතක ධාරිතාවය සහ DB ප්‍රතිචාර වේගය Dashboard එක හරහා සජීවීව නිරීක්ෂණය කළ හැක."}
                </p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl">
                <h4 className="text-sm font-semibold text-blue-400 mb-2">🔄 {language === 'en' ? 'Network Latency Simulator' : 'ජාල ප්‍රමාද අනුකාරකය'}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'en'
                    ? "Simulates 4G, 3G, Packet Loss, or complete Offline modes at checkout to demonstrate resilient LocalStorage queueing and sync conflicts resolution rules ('Server wins' vs 'Local wins')."
                    : "4G, 3G, සහ ජාල බිඳවැටීම් (Offline) තත්ත්වයන් අනුකරණය කරමින් දේශීය දත්ත සමමුහුර්තකරණය ක්‍රියා කරන ආකාරය සජීවීව නිරූපණය කරයි."}
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-blue-300">
              <span className="text-slate-500">// Real-time Latency & Offline State Resolver</span><br />
              <span className="text-purple-400">const</span> executeTransaction = (sale, networkMode) =&gt; &#123;<br />
              &nbsp;&nbsp;<span className="text-purple-400">if</span> (networkMode === <span className="text-emerald-300">&apos;offline&apos;</span>) &#123;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;localSyncQueue.push(&#123; ...sale, status: <span className="text-emerald-300">&apos;PendingSync&apos;</span> &#125;);<br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">return</span> saveToLocalStorage();<br />
              &nbsp;&nbsp;&#125;<br />
              &nbsp;&nbsp;<span className="text-purple-400">return</span> postWithLatency(sale, simulatedLatencyMs);<br />
              &#125;
            </div>
          </div>
        );
      case 'designer':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Server className="h-6 w-6 text-emerald-500" />
              <h3 className="text-xl font-bold text-slate-100">
                {language === 'en' ? 'Ergonomic Bilingual UI/UX' : 'ද්විභාෂා පරිශීලක අත්දැකීම් සැලසුම (UI/UX Designer)'}
              </h3>
            </div>

            <p className="text-slate-300 leading-relaxed text-sm">
              {language === 'en'
                ? "The shop owner operates in a fast-paced environment handling hardware, hot food, and photocopying simultaneously. Our UI/UX philosophy prioritizes high-contrast touch points, rapid-fire search inputs, and a seamless language toggle (English/Sinhala) so staff can input in whatever language they are comfortable with."
                : "වෙළඳසැල් හිමියා එකවර දෘඩාංග, උණුසුම් ආහාර, සහ ෆොටෝ කොපි කිරීම් වැනි බොහෝ දේ හසුරුවයි. අපගේ සැලසුම ඉහළ ප්‍රතිවිරෝධතා (contrast), වේගවත් සෙවුම් සහ පහසු සිංහල/ඉංග්‍රීසි භාෂා මාරුවකට ප්‍රමුඛතාවය දෙයි."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl text-center">
                <span className="text-2xl">🗣️</span>
                <h4 className="text-xs font-semibold text-emerald-400 mt-2 mb-1">{language === 'en' ? 'Voice POS Command' : 'කටහඬින් POS මෙහෙයවීම'}</h4>
                <p className="text-[11px] text-slate-400">{language === 'en' ? 'Speak commands like "add charger" or "සොයන්න reloads" to trigger hands-free cart operations.' : 'කටහඬ මඟින් භාණ්ඩ සෙවීමට හෝ කරත්තයට එක් කිරීමට හැකි වීම.'}</p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl text-center">
                <span className="text-2xl">🧾</span>
                <h4 className="text-xs font-semibold text-emerald-400 mt-2 mb-1">{language === 'en' ? 'Live Receipt Roll Preview' : 'බිල්පත් පෙරදසුන'}</h4>
                <p className="text-[11px] text-slate-400">{language === 'en' ? 'Live 3D-ish thermal receipt previewer adjusting layout widths (58mm/80mm) with LANKAQR.' : 'මිලදී ගැනීමේ බිල්පත මුද්‍රණය කිරීමට පෙර සජීවීව බලාගත හැක.'}</p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl text-center">
                <span className="text-2xl">🎨</span>
                <h4 className="text-xs font-semibold text-emerald-400 mt-2 mb-1">{language === 'en' ? 'Dynamic CSS Themes' : 'විවිධ තේමා 4ක්'}</h4>
                <p className="text-[11px] text-slate-400">{language === 'en' ? 'OLED Dark, Glassmorphism, Emerald Cyber, and Light Slate themes dynamically injected on-the-fly.' : 'සම්පූර්ණ පද්ධතියේ වර්ණ මාලාවන් තත්පරයකින් වෙනස් කිරීමේ හැකියාව.'}</p>
              </div>
            </div>
          </div>
        );
      case 'database':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Database className="h-6 w-6 text-amber-500" />
              <h3 className="text-xl font-bold text-slate-100">
                {language === 'en' ? 'Relational Schema & Customer Search Indexes' : 'දත්ත ගබඩා සැලැස්ම සහ වේගවත් සෙවුම් (Database Engineer)'}
              </h3>
            </div>

            <p className="text-slate-300 leading-relaxed text-sm">
              {language === 'en'
                ? "For a shop carrying out device repairs (which take days or weeks), customer data is gold. We designed a relational schema where Customers are central. Every Sale and Repair Job links back to a Customer ID. To ensure instantaneous customer search, we simulate indexed lookup fields on Name, Phone, and Email."
                : "උපාංග අලුත්වැඩියා කරන වෙළඳසැලකට පාරිභෝගික දත්ත ඉතා වටිනා සම්පතකි. අපි පාරිභෝගිකයා කේන්ද්‍ර කරගත් දත්ත ආකෘතියක් නිර්මාණය කළෙමු. සෑම විකුණුමක් සහ රෙපෙයාර් එකක්ම පාරිභෝගික අංකයට (Customer ID) සම්බන්ධ වේ."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl">
                <h4 className="text-sm font-semibold text-amber-400 mb-2">💾 {language === 'en' ? 'Incremental snapshots & Rollbacks' : 'දේශීය ස්නැප්ෂොට් සහ රෝල්බැක්'}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'en'
                    ? "Stores rolling historical snapshots of database states. Allows cashiers to instantly rollback to prior check-points if items or sales are accidentally deleted."
                    : "වැරදීමකින් තොග දත්ත මැකී ගියහොත් වහාම පෙර තිබූ තත්ත්වයට දත්ත පද්ධතිය රෝල්බැක් (Rollback) කළ හැකිය."}
                </p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl">
                <h4 className="text-sm font-semibold text-amber-400 mb-2">📊 {language === 'en' ? 'Database Health check Inspector' : 'දත්ත සමුදාය නිරෝගීතා පරීක්ෂක'}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'en'
                    ? "Checks reference constraints, negative prices, negative stock, and duplicate record IDs, displaying a database health index score (e.g. 100% Healthy)."
                    : "දත්ත පද්ධතියේ කිසිදු ගැටුමක් නොමැති බව තහවුරු කිරීමට නිරන්තරයෙන් නිරෝගීතා පරීක්ෂාවන් (Integrity Checks) සිදු කරයි."}
                </p>
              </div>
            </div>

            {/* Interactive SQL Explainer Sandbox */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3 font-sans">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center">
                  <Terminal className="h-4 w-4 mr-1.5" />
                  SQL Query Optimizer & Execution Sandbox
                </h4>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono">EXPLAIN ANALYZE</span>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold block text-left">Choose SQL Command to Inspect:</label>
                <div className="flex gap-2">
                  <select
                    value={selectedQuery}
                    onChange={(e) => setSelectedQuery(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 text-xs font-mono rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none"
                  >
                    <option value="q1">SELECT id, nameEn, stock FROM products WHERE stock &lt;= lowStockAlert;</option>
                    <option value="q2">SELECT r.id, c.name, r.estimatedCost FROM repairs r JOIN customers c ON r.customerId = c.id WHERE r.status = &apos;Pending&apos;;</option>
                    <option value="q3">SELECT COUNT(*), SUM(total), SUM(totalTax) FROM sales WHERE date(createdAt) = current_date;</option>
                  </select>
                  <button
                    onClick={() => {
                      setQueryRunning(true);
                      setTimeout(() => setQueryRunning(false), 600);
                    }}
                    disabled={queryRunning}
                    className="bg-amber-600 hover:bg-amber-700 text-slate-950 px-4 py-1.5 text-xs font-extrabold transition font-sans"
                  >
                    {queryRunning ? 'Running...' : 'Execute'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 font-mono text-[11px] leading-relaxed text-emerald-400 text-left overflow-x-auto min-h-[145px] whitespace-pre">
                {queryRunning ? (
                  <span className="text-slate-500 animate-pulse">Running query planner...\nAnalyzing catalog indexes...\nSimulating table joins...</span>
                ) : selectedQuery === 'q1' ? (
                  `QUERY PLAN:\n` +
                  `->  Index Scan using idx_products_stock on products  (cost=0.15..12.40 rows=3 width=46) (actual time=0.082..0.124 rows=3 loops=1)\n` +
                  `      Index Cond: (stock <= lowStockAlert)\n` +
                  `Planning Time: 0.115 ms\n` +
                  `Execution Time: 0.142 ms\n` +
                  `------------------------------------------------------------\n` +
                  `* DB ENGINEER NOTE: This query uses the custom index 'idx_products_stock' in LocalStorage to bypass sequential scans, preventing O(N) lookup overhead as products scale.`
                ) : selectedQuery === 'q2' ? (
                  `QUERY PLAN:\n` +
                  `->  Hash Join  (cost=4.20..18.50 rows=5 width=84) (actual time=0.142..0.312 rows=4 loops=1)\n` +
                  `      Hash Cond: (repairs.customerId = customers.id)\n` +
                  `      ->  Seq Scan on repairs  (cost=0.00..11.20 rows=6 width=60) (actual time=0.012..0.045 rows=6 loops=1)\n` +
                  `            Filter: (status = 'Pending'::text)\n` +
                  `      ->  Hash  (cost=3.50..3.50 rows=56 width=32) (actual time=0.085..0.085 rows=56 loops=1)\n` +
                  `            ->  Seq Scan on customers  (cost=0.00..3.50 rows=56 width=32) (actual time=0.005..0.038 rows=56 loops=1)\n` +
                  `Planning Time: 0.384 ms\n` +
                  `Execution Time: 0.405 ms\n` +
                  `------------------------------------------------------------\n` +
                  `* DB ENGINEER NOTE: The planner builds an in-memory hash table of customers, optimizing the join operation to O(M+N) instead of O(M*N) nested loops.`
                ) : (
                  `QUERY PLAN:\n` +
                  `->  Aggregate  (cost=22.30..22.35 rows=1 width=40) (actual time=0.612..0.615 rows=1 loops=1)\n` +
                  `      ->  Seq Scan on sales  (cost=0.00..20.10 rows=88 width=24) (actual time=0.015..0.452 rows=90 loops=1)\n` +
                  `            Filter: (date(createdAt) = CURRENT_DATE)\n` +
                  `Planning Time: 0.182 ms\n` +
                  `Execution Time: 0.654 ms\n` +
                  `------------------------------------------------------------\n` +
                  `* DB ENGINEER NOTE: Since sales ledger tables grow continuously, we recommend partitioning the table by transaction date in high-volume stores to keep index lookup depths shallow.`
                )}
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <UserCheck className="h-6 w-6 text-rose-500" />
              <h3 className="text-xl font-bold text-slate-100">
                {language === 'en' ? 'Cybersecurity & Cryptographic auditing' : 'සයිබර් ආරක්ෂාව සහ ගුප්ත ලේඛන විගණනය (Cybersecurity Specialist)'}
              </h3>
            </div>

            <p className="text-slate-300 leading-relaxed text-sm">
              {language === 'en'
                ? "Running a web-accessible store while operating a physical cash drawer demands strict security standards. We have engineered the application with defensive controls to protect business-critical data from compromise."
                : "වෙබ් අඩවියක් සහ මුදල් ලාච්චුවක් එකවර හැසිරවීමේදී ඉහළ ආරක්ෂාවක් අවශ්‍ය වේ. ව්‍යාපාරයේ දත්ත ආරක්ෂා කිරීම සඳහා අපි ගුප්ත ලේඛන හා ආරක්ෂිත ක්‍රමවේදයන් රැසක් ඇතුළත් කර ඇත්තෙමු."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl text-center">
                <span className="text-2xl">🔗</span>
                <h4 className="text-xs font-semibold text-rose-400 mt-2 mb-1">{language === 'en' ? 'Blockchain Audit Logs' : 'බ්ලොක්චේන් විගණන වාර්තා'}</h4>
                <p className="text-[11px] text-slate-400">{language === 'en' ? 'Chains each log entry with the previous log using cryptographic checksums to detect database tampering.' : 'සෑම ක්‍රියාවක්ම පෙර සටහනට සම්බන්ධ කර ගුප්ත ලේඛන ක්‍රමයට ගබඩා කරයි.'}</p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl text-center">
                <span className="text-2xl">🛡️</span>
                <h4 className="text-xs font-semibold text-rose-400 mt-2 mb-1">{language === 'en' ? 'Access Control PIN' : 'පින් කෝඩ් මුද්‍රාව'}</h4>
                <p className="text-[11px] text-slate-400">{language === 'en' ? 'Secures admin dashboards with customized PIN validation and 30-second locks after 3 failed attempts.' : 'පින් අංක ආරක්ෂාව සහ අසාර්ථක උත්සාහයන් 3කට පසු සිස්ටම් ලොක් කිරීමේ හැකියාව.'}</p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl text-center">
                <span className="text-2xl">🔐</span>
                <h4 className="text-xs font-semibold text-rose-400 mt-2 mb-1">{language === 'en' ? 'Encrypted Local Backups' : 'ආරක්ෂිත ගොනු අපනයනය'}</h4>
                <p className="text-[11px] text-slate-400">{language === 'en' ? 'Symmetric XOR password-based encryption layer for file exports to protect customer PII data.' : 'විකුණුම් තොරතුරු පාස්වර්ඩ් එකක් මඟින් ගුප්ත ලේඛන ගත කර (Encrypt) පරිගණකයට බාගත කිරීම.'}</p>
              </div>
            </div>
          </div>
        );
      case 'product':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Briefcase className="h-6 w-6 text-indigo-500" />
              <h3 className="text-xl font-bold text-slate-100">
                {language === 'en' ? 'Product Strategy & Operational Efficiency' : 'නිෂ්පාදන උපායමාර්ගය සහ ව්‍යාපාරික වර්ධනය (Product Manager)'}
              </h3>
            </div>

            <p className="text-slate-300 leading-relaxed text-sm">
              {language === 'en'
                ? "This system is engineered to maximize profitability by supporting dual pricing models: wholesale (thoga) and retail (sillara). The integration of high-margin self-manufactured goods, services, and customer retention mechanisms ensures consistent cash flow."
                : "මෙම පද්ධතිය තොග සහ සිල්ලර මිල ක්‍රම දෙකම සක්‍රීය කරමින් ලාභය උපරිම කිරීමට සකසා ඇත. මමම සාදන උණුසුම් කෑම සහ සේවා මඟින් දිනපතා ස්ථාවර ආදායමක් ලැබෙනු ඇත."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl">
                <h4 className="text-sm font-semibold text-indigo-400 mb-1">📈 {language === 'en' ? 'Customer Loyalty Tiers' : 'ලෝයල්ටි වර්ගීකරණය'}</h4>
                <p className="text-xs text-slate-400">
                  {language === 'en'
                    ? "Automatically groups customers into Bronze, Silver (2%), Gold (5%), and Platinum (10%) tiers based on points, deducting discounts instantly inside the POS terminal."
                    : "ගැනුම්කරුවන් ලබාගත් ලකුණු ප්‍රමාණය අනුව කාණ්ඩ කර විකුණුම් බිල සැකසීමේදී ස්වයංක්‍රීයව වට්ටම් ලබා දෙයි."}
                  </p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl">
                <h4 className="text-sm font-semibold text-indigo-400 mb-1">🛠️ {language === 'en' ? 'Wholesale Volume rules' : 'තොග මිල ස්වයංක්‍රීයකරණය'}</h4>
                <p className="text-xs text-slate-400">
                  {language === 'en'
                    ? "Once the quantity threshold of an item is crossed inside the POS cart, the wholesale pricing rules engine instantly kicks in without manual staff configuration."
                    : "භාණ්ඩයක අවම තොග සීමාව සපුරාලූ සැනින් මුළු බිලම තොග මිල ගණන් වලට ස්වයංක්‍රීයව වෙනස් වේ."}
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 border-b border-slate-800">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
          <span>💡</span>
          <span>{language === 'en' ? 'Expert Engineering & Architectural Design' : 'විශේෂඥ ඉංජිනේරු සහ සැලසුම් මණ්ඩලය'}</span>
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {language === 'en'
            ? 'See how our cross-functional team of experts architected this system to serve your 24-hour business.'
            : 'ඔබගේ පැය 24 පුරා ක්‍රියාත්මක වන ව්‍යාපාරයට ගැළපෙන සේ අපගේ ඉංජිනේරු කණ්ඩායම මෙම පද්ධතිය සකසා ඇති ආකාරය බලන්න.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Sidebar Roles list */}
        <div className="lg:col-span-4 border-r border-slate-800 bg-slate-900/50 p-4 space-y-2">
          {roles.map((role) => {
            const Icon = role.icon;
            const isActive = activeRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id)}
                className={`w-full text-left p-3.5 rounded-xl border flex items-start space-x-3 transition-all ${
                  isActive
                    ? role.activeColor
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 text-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-white/10 text-white' : role.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold truncate">{role.name}</h4>
                  <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-indigo-100' : 'text-slate-500'}`}>
                    {role.tagline}
                  </p>
                </div>
                <ChevronRight className={`h-4 w-4 self-center transition-transform ${isActive ? 'rotate-90' : 'text-slate-600'}`} />
              </button>
            );
          })}
        </div>

        {/* Dynamic Detail Content */}
        <div className="lg:col-span-8 p-6 md:p-8 bg-slate-900/30">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
