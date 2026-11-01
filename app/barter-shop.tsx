'use client';
import {useState} from 'react';
import {BARTER_CATALOG,type BarterItem,type BarterType} from './barter-options';
import {itemKey} from './cosmetics';
import type {GuildMember,GuildData} from './guild-types';
import {TreePine,Leaf,Ticket,Tag,Sparkles,Check,LockKeyhole,ArrowRight,Store} from 'lucide-react';

export default function BarterShop({
  member,
  busy,
  onData,
  onToast,
}: {
  member: GuildMember;
  busy: boolean;
  onData: (d: GuildData) => void;
  onToast: (msg: string) => void;
}) {
  const [filter, setFilter] = useState<'all' | BarterType>('all');
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const ownedItems = member.wardrobe?.owned ?? [];
  const ownedTitles = member.wardrobe?.titles ?? member.titles ?? [];
  const activeTitle = member.wardrobe?.title ?? member.title ?? '';
  const wood = member.wood ?? 0;
  const herbs = member.herbs ?? 0;

  async function handleBarter(item: BarterItem) {
    if (busy || purchasing) return;
    setPurchasing(item.id);
    try {
      const res = await fetch('/api/guild', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: 'barter', itemId: item.id}),
      });
      const data = (await res.json()) as GuildData & {error?: string; barterSuccess?: string};
      if (!res.ok) throw new Error(data.error || 'Gagal menukarkan item.');
      onData(data);
      onToast(`Berhasil menukar ${item.name}!`);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Gagal menukar. Coba lagi.');
    } finally {
      setPurchasing(null);
    }
  }

  async function handleSetTitle(titleText: string) {
    if (busy || purchasing) return;
    setPurchasing('title:' + titleText);
    try {
      const res = await fetch('/api/guild', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: 'setTitle', title: titleText}),
      });
      const data = (await res.json()) as GuildData & {error?: string};
      if (!res.ok) throw new Error(data.error || 'Gagal mengganti gelar.');
      onData(data);
      onToast(titleText ? `Gelar dipasang: "${titleText}"` : 'Gelar dilepas.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Gagal mengganti gelar.');
    } finally {
      setPurchasing(null);
    }
  }

  const items = BARTER_CATALOG.filter(i => filter === 'all' || i.type === filter);

  return (
    <section className="barter-shop" aria-labelledby="barter-shop-title">
      <div className="barter-header">
        <div className="barter-header-text">
          <div className="eyebrow"><Store size={15} /> KEDAI BARTER ARU · PUNGGUNG RUMU</div>
          <h2 id="barter-shop-title">Tukar Hasil Alam Rimba</h2>
          <p>
            Gunakan kayu dan daun obat yang kamu kumpulkan untuk tiket spin, pakaian eksklusif belantara, atau tag nama petualang.
          </p>
        </div>
        <div className="barter-balance-bar">
          <div className="barter-balance-pill">
            <TreePine size={18} className="icon-wood" />
            <span><b>{wood}</b> Kayu</span>
          </div>
          <div className="barter-balance-pill">
            <Leaf size={18} className="icon-herbs" />
            <span><b>{herbs}</b> Daun</span>
          </div>
          <div className="barter-balance-pill">
            <Ticket size={18} className="icon-ticket" />
            <span><b>{member.tickets ?? 0}</b> Tiket</span>
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="barter-tabs" role="tablist">
        {[
          {id: 'all', label: 'Semua Penukaran'},
          {id: 'ticket', label: '🎟️ Tiket Spin'},
          {id: 'cosmetic', label: '👘 Kosmetik Rimba'},
          {id: 'title', label: '🏷️ Gelar Petualang'},
        ].map(t => (
          <button
            key={t.id}
            type="button"
            className={filter === t.id ? 'active' : ''}
            onClick={() => setFilter(t.id as typeof filter)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CATALOG GRID */}
      <div className="barter-grid">
        {items.map(item => {
          const isTicket = item.type === 'ticket';
          const isCosmetic = item.type === 'cosmetic';
          const isTitle = item.type === 'title';

          const ownedCosmetic = isCosmetic && item.cosmeticKey ? ownedItems.includes(item.cosmeticKey) : false;
          const ownedTitle = isTitle && item.titleText ? ownedTitles.includes(item.titleText) : false;
          const isEquippedTitle = isTitle && item.titleText === activeTitle;

          const canAfford = wood >= item.woodCost && herbs >= item.herbsCost;
          const isCurrentLoading = purchasing === item.id || purchasing === 'title:' + item.titleText;

          return (
            <article key={item.id} className={'barter-card ' + item.type + (ownedCosmetic || isEquippedTitle ? ' owned' : '')}>
              <div className="barter-card-top">
                <div className="barter-type-pill">
                  {isTicket ? <Ticket size={13} /> : isCosmetic ? <Sparkles size={13} /> : <Tag size={13} />}
                  <span>{isTicket ? 'Tiket' : isCosmetic ? 'Kosmetik' : 'Gelar'}</span>
                </div>
                {item.titleText && (
                  <span className="title-preview-tag" style={{borderColor: item.badgeColor, color: item.badgeColor}}>
                    {item.titleText}
                  </span>
                )}
              </div>

              <h3>{item.name}</h3>
              <p className="barter-card-desc">{item.description}</p>

              <div className="barter-card-costs">
                <span className={'cost-tag ' + (wood >= item.woodCost ? 'ok' : 'short')}>
                  <TreePine size={14} /> {item.woodCost} Kayu
                </span>
                <span className={'cost-tag ' + (herbs >= item.herbsCost ? 'ok' : 'short')}>
                  <Leaf size={14} /> {item.herbsCost} Daun
                </span>
              </div>

              <div className="barter-card-action">
                {isCosmetic && ownedCosmetic ? (
                  <button type="button" className="barter-btn disabled" disabled>
                    <Check size={14} /> Dimiliki di Lemari
                  </button>
                ) : isTitle && ownedTitle ? (
                  isEquippedTitle ? (
                    <button type="button" className="barter-btn active" onClick={() => handleSetTitle('')} disabled={busy || isCurrentLoading}>
                      <Check size={14} /> Gelar Aktif (Lepas)
                    </button>
                  ) : (
                    <button type="button" className="barter-btn equip" onClick={() => handleSetTitle(item.titleText!)} disabled={busy || isCurrentLoading}>
                      <ArrowRight size={14} /> Pasang Gelar
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    className={'barter-btn buy ' + (canAfford ? 'primary' : 'disabled')}
                    disabled={!canAfford || busy || isCurrentLoading}
                    onClick={() => handleBarter(item)}
                  >
                    {isCurrentLoading ? 'Menukar…' : canAfford ? 'Tukar Sekarang' : 'Bahan Belum Cukup'}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* OWNED TITLES BAR */}
      {ownedTitles.length > 0 && (
        <div className="owned-titles-section">
          <div className="owned-titles-header">
            <Tag size={16} />
            <b>Koleksi Gelar Petualang ({ownedTitles.length})</b>
            <span>Pasang gelar untuk ditampilkan di samping nama karaktermu:</span>
          </div>
          <div className="owned-titles-list">
            <button
              type="button"
              className={'title-chip ' + (activeTitle === '' ? 'selected' : '')}
              onClick={() => handleSetTitle('')}
              disabled={busy}
            >
              Tanpa Gelar
            </button>
            {ownedTitles.map(t => {
              const matched = BARTER_CATALOG.find(b => b.titleText === t);
              return (
                <button
                  key={t}
                  type="button"
                  className={'title-chip ' + (activeTitle === t ? 'selected' : '')}
                  style={matched?.badgeColor ? {borderColor: matched.badgeColor} : undefined}
                  onClick={() => handleSetTitle(t)}
                  disabled={busy}
                >
                  {activeTitle === t && <Check size={12} />}
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
