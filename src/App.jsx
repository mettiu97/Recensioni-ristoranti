import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const avg = (reviews) => {
  if (!reviews || !reviews.length) return 0;
  const total = reviews.reduce(
    (s, r) => s + (r.cibo + r.servizio + r.atmosfera + r.qualita_prezzo) / 4, 0
  );
  return +(total / reviews.length).toFixed(1);
};

const scoreColor = (s) => {
  if (s >= 9) return "#2D6A4F";
  if (s >= 7) return "#B5854A";
  return "#C0392B";
};

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
};

// Upload a file to Supabase Storage and return the public URL
const uploadPhoto = async (file, folder = "general") => {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("photos").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("photos").getPublicUrl(path);
  return data.publicUrl;
};

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const icons = {
    heart: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
    heartOutline: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    close: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    back: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
    filter: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>,
    sort: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M7 12h10M11 18h2"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
    photo: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    upload: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  };
  return <span style={{ color, display: "inline-flex", alignItems: "center" }}>{icons[name]}</span>;
};

// ─── SCORE BADGE ──────────────────────────────────────────────────────────────
const ScoreBadge = ({ score, size = "md" }) => {
  const s = size === "lg"
    ? { fontSize: 26, padding: "7px 14px", borderRadius: 12 }
    : { fontSize: 14, padding: "3px 9px", borderRadius: 8 };
  return (
    <div style={{ background: scoreColor(score), color: "#fff", fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, display: "inline-flex", alignItems: "center", ...s }}>
      {score > 0 ? score.toFixed(1) : "—"}
    </div>
  );
};

// ─── STAR RATING INPUT ────────────────────────────────────────────────────────
const StarRating = ({ value, onChange, label }) => {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: "#8B7355", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontFamily: "sans-serif" }}>{label}</div>
      <div style={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap" }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} onClick={() => onChange(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
            style={{ width: 26, height: 26, borderRadius: 5, border: "none", cursor: "pointer", background: n <= (hover || value) ? "#C8956C" : "#E8DDD0", color: n <= (hover || value) ? "#fff" : "#8B7355", fontSize: 11, fontWeight: 700, fontFamily: "sans-serif", transition: "all 0.15s" }}>
            {n}
          </button>
        ))}
        <span style={{ marginLeft: 8, fontSize: 18, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, color: "#3D2B1F" }}>{value || "—"}</span>
      </div>
    </div>
  );
};

// ─── PHOTO UPLOADER ───────────────────────────────────────────────────────────
const PhotoUploader = ({ label, onUpload, preview, onRemove, multiple = false, uploadedUrls = [], onRemoveUrl }) => {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const url = await uploadPhoto(file, "restaurants");
        onUpload(url);
      }
    } catch (err) {
      alert("Errore caricamento: " + err.message);
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: "#8B7355", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontFamily: "sans-serif" }}>{label}</div>

      {/* Single preview (cover) */}
      {preview && (
        <div style={{ position: "relative", marginBottom: 10, borderRadius: 10, overflow: "hidden", height: 140 }}>
          <img src={preview} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <button onClick={onRemove} style={{ position: "absolute", top: 8, right: 8, background: "rgba(30,18,10,0.7)", border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="close" size={14} color="#FAF7F2" />
          </button>
        </div>
      )}

      {/* Multiple previews (review photos) */}
      {uploadedUrls.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {uploadedUrls.map((url, i) => (
            <div key={i} style={{ position: "relative", width: 80, height: 80, borderRadius: 8, overflow: "hidden" }}>
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button onClick={() => onRemoveUrl(i)} style={{ position: "absolute", top: 4, right: 4, background: "rgba(30,18,10,0.7)", border: "none", borderRadius: 4, width: 22, height: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="close" size={11} color="#FAF7F2" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => inputRef.current.click()} disabled={uploading}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", border: "1.5px dashed #C8956C", borderRadius: 10, background: "transparent", cursor: uploading ? "not-allowed" : "pointer", color: "#C8956C", fontFamily: "Georgia, serif", fontSize: 13, width: "100%", justifyContent: "center" }}>
        <Icon name="upload" size={15} color="#C8956C" />
        {uploading ? "Caricamento..." : `Carica ${multiple ? "foto" : "foto di copertina"}`}
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple={multiple} onChange={handleFile} style={{ display: "none" }} />
    </div>
  );
};

// ─── AUTH MODAL ───────────────────────────────────────────────────────────────
const AuthModal = ({ onClose, onLogin }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle = { width: "100%", padding: "12px 16px", border: "1.5px solid #DDD4C5", borderRadius: 10, marginBottom: 12, fontFamily: "Georgia, serif", fontSize: 14, background: "#FFFDF9", boxSizing: "border-box", outline: "none", color: "#3D2B1F" };

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) { setError(err.message); setLoading(false); return; }
        const meta = data.user?.user_metadata;
        onLogin({ id: data.user.id, email: data.user.email, username: meta?.username || email.split("@")[0] });
        onClose();
      } else {
        if (!username) { setError("Inserisci uno username"); setLoading(false); return; }
        const { data, error: err } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
        if (err) { setError(err.message); setLoading(false); return; }
        if (data.user) {
          onLogin({ id: data.user.id, email: data.user.email, username });
          onClose();
        } else {
          setError("Controlla la tua email per confermare l'account.");
        }
      }
    } catch (e) { setError("Errore di connessione"); }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,18,10,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#FAF7F2", borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 400, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "#8B7355" }}><Icon name="close" size={20} /></button>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: "#3D2B1F", marginBottom: 6 }}>{mode === "login" ? "Bentornato" : "Unisciti a noi"}</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 13, color: "#8B7355", marginBottom: 24 }}>{mode === "login" ? "Accedi al tuo account" : "Crea il tuo account"}</div>
        {mode === "signup" && <input placeholder="Username *" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} />}
        <input placeholder="Email *" value={email} onChange={e => setEmail(e.target.value)} type="email" style={inputStyle} />
        <input placeholder="Password *" value={password} onChange={e => setPassword(e.target.value)} type="password" style={inputStyle} />
        {error && <div style={{ color: "#C0392B", fontSize: 13, marginBottom: 14, fontFamily: "Georgia, serif" }}>{error}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "14px", background: loading ? "#8B7355" : "#3D2B1F", color: "#FAF7F2", border: "none", borderRadius: 10, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 700 }}>
          {loading ? "Caricamento..." : mode === "login" ? "Accedi" : "Registrati"}
        </button>
        <div style={{ textAlign: "center", marginTop: 16, fontFamily: "Georgia, serif", fontSize: 13, color: "#8B7355" }}>
          {mode === "login" ? "Non hai un account? " : "Hai già un account? "}
          <span onClick={() => setMode(mode === "login" ? "signup" : "login")} style={{ color: "#C8956C", cursor: "pointer", textDecoration: "underline" }}>
            {mode === "login" ? "Registrati" : "Accedi"}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── ADD RESTAURANT MODAL ─────────────────────────────────────────────────────
const AddRestaurantModal = ({ onClose, onAdd, currentUser }) => {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [priceRange, setPriceRange] = useState("€€");
  const [dateVisit, setDateVisit] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputStyle = { width: "100%", padding: "11px 14px", border: "1.5px solid #DDD4C5", borderRadius: 10, marginBottom: 12, fontFamily: "Georgia, serif", fontSize: 14, background: "#FFFDF9", boxSizing: "border-box", outline: "none", color: "#3D2B1F" };

  const handleSubmit = async () => {
    if (!name || !city || !dateVisit) { setError("Nome, città e data sono obbligatori"); return; }
    setLoading(true);
    const { data, error: err } = await supabase.from("restaurants").insert({
      name, city,
      location: location || city,
      price_range: priceRange,
      date_visit: dateVisit,
      cover_photo: coverUrl || null,
      photos: [],
      added_by: currentUser.id,
    }).select().single();
    if (err) { setError(err.message); setLoading(false); return; }
    onAdd({ ...data, reviews: [] });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,18,10,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto" }}>
      <div style={{ background: "#FAF7F2", borderRadius: 20, padding: "36px 32px", width: "100%", maxWidth: 460, position: "relative", marginTop: "auto", marginBottom: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "#8B7355" }}><Icon name="close" size={20} /></button>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: "#3D2B1F", marginBottom: 24 }}>Aggiungi ristorante</div>
        <input placeholder="Nome ristorante *" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        <input placeholder="Città *" value={city} onChange={e => setCity(e.target.value)} style={inputStyle} />
        <input placeholder="Indirizzo / quartiere" value={location} onChange={e => setLocation(e.target.value)} style={inputStyle} />

        {/* Photo uploader invece di URL */}
        <PhotoUploader
          label="Foto di copertina (opzionale)"
          onUpload={(url) => setCoverUrl(url)}
          preview={coverUrl}
          onRemove={() => setCoverUrl("")}
        />

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#8B7355", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontFamily: "sans-serif" }}>Fascia di prezzo</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["€", "€€", "€€€"].map(p => (
              <button key={p} onClick={() => setPriceRange(p)} style={{ padding: "8px 18px", border: `1.5px solid ${priceRange === p ? "#C8956C" : "#DDD4C5"}`, borderRadius: 8, background: priceRange === p ? "#C8956C" : "transparent", color: priceRange === p ? "#fff" : "#8B7355", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 600 }}>{p}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#8B7355", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontFamily: "sans-serif" }}>Data visita *</div>
          <input type="date" value={dateVisit} onChange={e => setDateVisit(e.target.value)} style={inputStyle} />
        </div>
        {error && <div style={{ color: "#C0392B", fontSize: 13, marginBottom: 14, fontFamily: "Georgia, serif" }}>{error}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "14px", background: loading ? "#8B7355" : "#3D2B1F", color: "#FAF7F2", border: "none", borderRadius: 10, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 700 }}>
          {loading ? "Salvataggio..." : "Aggiungi ristorante"}
        </button>
      </div>
    </div>
  );
};

// ─── REVIEW MODAL ─────────────────────────────────────────────────────────────
const ReviewModal = ({ restaurant, existingReview, onClose, onSave, currentUser }) => {
  const [cibo, setCibo] = useState(existingReview?.cibo || 0);
  const [servizio, setServizio] = useState(existingReview?.servizio || 0);
  const [atmosfera, setAtmosfera] = useState(existingReview?.atmosfera || 0);
  const [qualitaPrezzo, setQualitaPrezzo] = useState(existingReview?.qualita_prezzo || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [photos, setPhotos] = useState(existingReview?.photos || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const myAvg = cibo && servizio && atmosfera && qualitaPrezzo
    ? ((cibo + servizio + atmosfera + qualitaPrezzo) / 4).toFixed(1) : null;

  const handleSave = async () => {
    if (!cibo || !servizio || !atmosfera || !qualitaPrezzo) { setError("Inserisci tutti i voti"); return; }
    setLoading(true);
    const payload = {
      restaurant_id: restaurant.id,
      user_id: currentUser.id,
      username: currentUser.username,
      cibo, servizio, atmosfera,
      qualita_prezzo: qualitaPrezzo,
      comment,
      photos,
    };
    let data, err;
    if (existingReview) {
      ({ data, error: err } = await supabase.from("reviews").update(payload).eq("id", existingReview.id).select().single());
    } else {
      ({ data, error: err } = await supabase.from("reviews").insert(payload).select().single());
    }
    if (err) { setError(err.message); setLoading(false); return; }
    onSave(restaurant.id, data);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,18,10,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto" }}>
      <div style={{ background: "#FAF7F2", borderRadius: 20, padding: "36px 32px", width: "100%", maxWidth: 480, position: "relative", marginTop: "auto", marginBottom: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "#8B7355" }}><Icon name="close" size={20} /></button>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: "#C8956C", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>{existingReview ? "Modifica recensione" : "La tua recensione"}</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: "#3D2B1F", marginBottom: 24 }}>{restaurant.name}</div>
        <StarRating value={cibo} onChange={setCibo} label="Cibo" />
        <StarRating value={servizio} onChange={setServizio} label="Servizio" />
        <StarRating value={atmosfera} onChange={setAtmosfera} label="Atmosfera" />
        <StarRating value={qualitaPrezzo} onChange={setQualitaPrezzo} label="Qualità / Prezzo" />
        {myAvg && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0", padding: "12px 16px", background: "#F0EAE0", borderRadius: 10 }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: 13, color: "#8B7355" }}>La tua media:</span>
            <ScoreBadge score={parseFloat(myAvg)} />
          </div>
        )}
        <textarea placeholder="Racconta la tua esperienza..." value={comment} onChange={e => setComment(e.target.value)} rows={4}
          style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #DDD4C5", borderRadius: 10, fontFamily: "Georgia, serif", fontSize: 14, background: "#FFFDF9", resize: "vertical", boxSizing: "border-box", outline: "none", color: "#3D2B1F", marginBottom: 16 }} />

        {/* Foto recensione */}
        <PhotoUploader
          label="Foto piatti (opzionale)"
          multiple={true}
          uploadedUrls={photos}
          onUpload={(url) => setPhotos(prev => [...prev, url])}
          onRemoveUrl={(i) => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
        />

        {error && <div style={{ color: "#C0392B", fontSize: 13, marginBottom: 14, fontFamily: "Georgia, serif" }}>{error}</div>}
        <button onClick={handleSave} disabled={loading} style={{ width: "100%", padding: "14px", background: loading ? "#8B7355" : "#3D2B1F", color: "#FAF7F2", border: "none", borderRadius: 10, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 700 }}>
          {loading ? "Salvataggio..." : existingReview ? "Aggiorna" : "Pubblica recensione"}
        </button>
      </div>
    </div>
  );
};

// ─── RESTAURANT DETAIL ────────────────────────────────────────────────────────
const RestaurantDetail = ({ restaurant, currentUser, favourites, onToggleFavourite, onSaveReview, onDeleteReview, onDeleteRestaurant, onBack }) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const allPhotos = [restaurant.cover_photo, ...(restaurant.photos || [])].filter(Boolean);
  const myReview = currentUser ? restaurant.reviews?.find(r => r.user_id === currentUser.id) : null;
  const globalAvg = avg(restaurant.reviews || []);
  const isFav = favourites.includes(restaurant.id);
  const isOwner = currentUser && restaurant.added_by === currentUser.id;
  const hasReviews = (restaurant.reviews || []).length > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#FAF7F2" }}>
      <div style={{ position: "relative", height: 320 }}>
        <img src={allPhotos[activePhoto] || "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80"} alt={restaurant.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(30,18,10,0.7) 100%)" }} />
        <button onClick={onBack} style={{ position: "absolute", top: 20, left: 20, background: "rgba(250,247,242,0.9)", border: "none", borderRadius: 10, width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="back" size={18} color="#3D2B1F" />
        </button>
        <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 8 }}>
          {currentUser && (
            <button onClick={() => onToggleFavourite(restaurant.id)} style={{ background: "rgba(250,247,242,0.9)", border: "none", borderRadius: 10, width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={isFav ? "heart" : "heartOutline"} size={20} color={isFav ? "#C0392B" : "#3D2B1F"} />
            </button>
          )}
          {/* Bottone elimina ristorante — solo owner, solo se senza recensioni */}
          {isOwner && !hasReviews && (
            <button onClick={() => setConfirmDelete(true)} style={{ background: "rgba(250,247,242,0.9)", border: "none", borderRadius: 10, width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="trash" size={18} color="#C0392B" />
            </button>
          )}
        </div>
        <div style={{ position: "absolute", bottom: 20, left: 20, right: 20 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: "rgba(250,247,242,0.8)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>{restaurant.price_range} · {restaurant.city}</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 700, color: "#FAF7F2", lineHeight: 1.1 }}>{restaurant.name}</div>
        </div>
        {allPhotos.length > 1 && (
          <div style={{ position: "absolute", bottom: 20, right: 20, display: "flex", gap: 6 }}>
            {allPhotos.map((_, i) => (
              <button key={i} onClick={() => setActivePhoto(i)} style={{ width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer", background: i === activePhoto ? "#FAF7F2" : "rgba(250,247,242,0.5)" }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "24px 20px", maxWidth: 700, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <ScoreBadge score={globalAvg} size="lg" />
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 13, color: "#8B7355" }}>{(restaurant.reviews || []).length} recension{(restaurant.reviews || []).length !== 1 ? "i" : "e"}</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#B0A090" }}>Visitato il {formatDate(restaurant.date_visit)}</div>
          </div>
          {isFav && <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, background: "#FFF0EC", padding: "6px 12px", borderRadius: 20 }}><Icon name="heart" size={14} color="#C0392B" /><span style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#C0392B" }}>Preferito</span></div>}
        </div>

        {(restaurant.reviews || []).length > 0 && (() => {
          const reviews = restaurant.reviews;
          const cats = [["cibo", "Cibo"], ["servizio", "Servizio"], ["atmosfera", "Atmosfera"], ["qualita_prezzo", "Qualità/Prezzo"]];
          return (
            <div style={{ background: "#F0EAE0", borderRadius: 16, padding: 20, marginBottom: 24 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: "#3D2B1F", marginBottom: 14, fontWeight: 600 }}>Media per categoria</div>
              {cats.map(([key, label]) => {
                const catAvg = +(reviews.reduce((s, r) => s + r[key], 0) / reviews.length).toFixed(1);
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 110, fontFamily: "Georgia, serif", fontSize: 12, color: "#8B7355" }}>{label}</div>
                    <div style={{ flex: 1, height: 6, background: "#DDD4C5", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${catAvg * 10}%`, height: "100%", background: scoreColor(catAvg), borderRadius: 3, transition: "width 0.6s" }} />
                    </div>
                    <div style={{ width: 28, fontFamily: "'Cormorant Garamond', serif", fontSize: 15, fontWeight: 700, color: "#3D2B1F", textAlign: "right" }}>{catAvg}</div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {currentUser && !myReview && (
          <button onClick={() => setShowReviewModal(true)} style={{ width: "100%", padding: "14px", background: "#3D2B1F", color: "#FAF7F2", border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 700, marginBottom: 24 }}>
            + Scrivi la tua recensione
          </button>
        )}

        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "#3D2B1F", marginBottom: 16 }}>Recensioni</div>

        {(restaurant.reviews || []).length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#B0A090", fontFamily: "Georgia, serif", fontSize: 14 }}>Nessuna recensione ancora. Sii il primo!</div>
        )}

        {(restaurant.reviews || []).map(review => {
          const reviewAvg = ((review.cibo + review.servizio + review.atmosfera + review.qualita_prezzo) / 4).toFixed(1);
          const isMyReview = currentUser && review.user_id === currentUser.id;
          const reviewPhotos = review.photos || [];
          return (
            <div key={review.id} style={{ background: "#FFFDF9", borderRadius: 16, padding: 20, marginBottom: 14, border: `1.5px solid ${isMyReview ? "#C8956C" : "#EDE5D8"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#C8956C", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 14 }}>{review.username?.[0] || "?"}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 700, color: "#3D2B1F" }}>{review.username}</div>
                  {isMyReview && <span style={{ fontSize: 11, color: "#C8956C", fontFamily: "sans-serif", background: "#FFF0E8", padding: "2px 8px", borderRadius: 10 }}>Tu</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ScoreBadge score={parseFloat(reviewAvg)} />
                  {isMyReview && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { setEditingReview(review); setShowReviewModal(true); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#8B7355" }}><Icon name="edit" size={16} /></button>
                      <button onClick={() => onDeleteReview(restaurant.id, review.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C0392B" }}><Icon name="trash" size={16} /></button>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", marginBottom: 12 }}>
                {[["Cibo", review.cibo], ["Servizio", review.servizio], ["Atmosfera", review.atmosfera], ["Qualità/P.", review.qualita_prezzo]].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontFamily: "Georgia, serif", fontSize: 12 }}>
                    <span style={{ color: "#8B7355" }}>{label}</span>
                    <span style={{ color: "#3D2B1F", fontWeight: 600 }}>{val}/10</span>
                  </div>
                ))}
              </div>
              {review.comment && <div style={{ fontFamily: "Georgia, serif", fontSize: 14, color: "#5A4535", lineHeight: 1.6, fontStyle: "italic", borderTop: "1px solid #EDE5D8", paddingTop: 12, marginBottom: reviewPhotos.length ? 12 : 0 }}>"{review.comment}"</div>}
              {reviewPhotos.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  {reviewPhotos.map((url, i) => (
                    <img key={i} src={url} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #EDE5D8" }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(30,18,10,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#FAF7F2", borderRadius: 20, padding: "36px 32px", width: "100%", maxWidth: 380, textAlign: "center" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#3D2B1F", marginBottom: 10 }}>Elimina ristorante</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 14, color: "#8B7355", marginBottom: 24 }}>Sei sicuro di voler eliminare <strong>{restaurant.name}</strong>? Questa azione non può essere annullata.</div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: "12px", background: "transparent", border: "1.5px solid #DDD4C5", borderRadius: 10, cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 14, color: "#8B7355" }}>Annulla</button>
              <button onClick={() => { onDeleteRestaurant(restaurant.id); onBack(); }} style={{ flex: 1, padding: "12px", background: "#C0392B", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 14, color: "#fff", fontWeight: 600 }}>Elimina</button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <ReviewModal restaurant={restaurant} existingReview={editingReview} onClose={() => { setShowReviewModal(false); setEditingReview(null); }} onSave={onSaveReview} currentUser={currentUser} />
      )}
    </div>
  );
};

// ─── RESTAURANT CARD ──────────────────────────────────────────────────────────
const RestaurantCard = ({ restaurant, currentUser, favourites, onToggleFavourite, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const globalAvg = avg(restaurant.reviews || []);
  const isFav = favourites.includes(restaurant.id);
  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: "#FFFDF9", borderRadius: 18, overflow: "hidden", cursor: "pointer", border: "1.5px solid #EDE5D8", transition: "transform 0.25s, box-shadow 0.25s", transform: hovered ? "translateY(-4px)" : "none", boxShadow: hovered ? "0 12px 40px rgba(61,43,31,0.14)" : "0 2px 8px rgba(61,43,31,0.06)" }}>
      <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
        <img src={restaurant.cover_photo || "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80"} alt={restaurant.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s", transform: hovered ? "scale(1.05)" : "scale(1)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(30,18,10,0.5) 100%)" }} />
        {currentUser && (
          <button onClick={e => { e.stopPropagation(); onToggleFavourite(restaurant.id); }} style={{ position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: 9, background: "rgba(250,247,242,0.92)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={isFav ? "heart" : "heartOutline"} size={15} color={isFav ? "#C0392B" : "#3D2B1F"} />
          </button>
        )}
        <div style={{ position: "absolute", bottom: 10, left: 10 }}><ScoreBadge score={globalAvg} /></div>
        <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(250,247,242,0.9)", padding: "3px 9px", borderRadius: 7, fontFamily: "Georgia, serif", fontSize: 12, color: "#3D2B1F", fontWeight: 600 }}>{restaurant.price_range}</div>
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: "#3D2B1F", marginBottom: 3, lineHeight: 1.2 }}>{restaurant.name}</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 11, color: "#8B7355", marginBottom: 8 }}>{restaurant.location}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 11, color: "#B0A090" }}>{(restaurant.reviews || []).length} recension{(restaurant.reviews || []).length !== 1 ? "i" : "e"}</div>
          {(restaurant.reviews || []).length > 0 && (
            <div style={{ display: "flex", gap: 6 }}>
              {[["C", "cibo"], ["S", "servizio"], ["A", "atmosfera"], ["Q", "qualita_prezzo"]].map(([l, k]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#B0A090", fontFamily: "sans-serif" }}>{l}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#3D2B1F", fontFamily: "'Cormorant Garamond', serif" }}>{(restaurant.reviews.reduce((s, r) => s + r[k], 0) / restaurant.reviews.length).toFixed(1)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── FAVOURITES PAGE ──────────────────────────────────────────────────────────
const FavouritesPage = ({ restaurants, favourites, currentUser, onToggleFavourite, onSelectRestaurant }) => {
  const favRestaurants = restaurants.filter(r => favourites.includes(r.id)).sort((a, b) => avg(b.reviews || []) - avg(a.reviews || []));
  const top3 = favRestaurants.slice(0, 3);
  const others = favRestaurants.slice(3);
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumHeights = [160, 200, 140];
  const podiumPos = [2, 1, 3];

  if (favRestaurants.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "#3D2B1F", marginBottom: 8 }}>Nessun preferito ancora</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 14, color: "#8B7355" }}>Aggiungi i tuoi ristoranti preferiti con il ❤️</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 20px", maxWidth: 700, margin: "0 auto" }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: "#C8956C", textTransform: "uppercase", letterSpacing: 3, marginBottom: 6 }}>I tuoi</div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 700, color: "#3D2B1F", marginBottom: 32 }}>Preferiti</div>
      {top3.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 12 }}>
            {podiumOrder.map((r, i) => {
              if (!r) return <div key={i} style={{ width: "30%" }} />;
              const rAvg = avg(r.reviews || []);
              const isFirst = podiumPos[i] === 1;
              return (
                <div key={r.id} onClick={() => onSelectRestaurant(r)} style={{ width: "30%", cursor: "pointer" }}>
                  <div style={{ textAlign: "center", marginBottom: 8 }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isFirst ? 28 : 22, marginBottom: 4 }}>{podiumPos[i] === 1 ? "🥇" : podiumPos[i] === 2 ? "🥈" : "🥉"}</div>
                    <img src={r.cover_photo || "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80"} alt={r.name} style={{ width: "100%", height: isFirst ? 100 : 80, objectFit: "cover", borderRadius: 12, border: `2px solid ${isFirst ? "#C8956C" : "#DDD4C5"}` }} />
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isFirst ? 15 : 13, fontWeight: 700, color: "#3D2B1F", marginTop: 6, lineHeight: 1.2 }}>{r.name}</div>
                    <ScoreBadge score={rAvg} />
                  </div>
                  <div style={{ height: podiumHeights[i] - 80, background: isFirst ? "#C8956C" : "#DDD4C5", borderRadius: "8px 8px 0 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: isFirst ? "#fff" : "#8B7355" }}>{podiumPos[i]}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ height: 8, background: "#DDD4C5", borderRadius: 4 }} />
        </div>
      )}
      {others.length > 0 && (
        <>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#3D2B1F", marginBottom: 14 }}>Altri preferiti</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {others.map(r => <RestaurantCard key={r.id} restaurant={r} currentUser={currentUser} favourites={favourites} onToggleFavourite={onToggleFavourite} onClick={() => onSelectRestaurant(r)} />)}
          </div>
        </>
      )}
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [favourites, setFavourites] = useState([]);
  const [page, setPage] = useState("home");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterPrice, setFilterPrice] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata;
        setCurrentUser({ id: session.user.id, email: session.user.email, username: meta?.username || session.user.email.split("@")[0] });
      }
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata;
        setCurrentUser({ id: session.user.id, email: session.user.email, username: meta?.username || session.user.email.split("@")[0] });
      } else {
        setCurrentUser(null);
        setFavourites([]);
      }
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: rests } = await supabase.from("restaurants").select("*").order("created_at", { ascending: false });
      const { data: revs } = await supabase.from("reviews").select("*");
      if (rests) {
        const withReviews = rests.map(r => ({ ...r, reviews: (revs || []).filter(rev => rev.restaurant_id === r.id) }));
        setRestaurants(withReviews);
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!currentUser) { setFavourites([]); return; }
    supabase.from("favourites").select("restaurant_id").eq("user_id", currentUser.id)
      .then(({ data }) => { if (data) setFavourites(data.map(f => f.restaurant_id)); });
  }, [currentUser]);

  const handleToggleFavourite = async (id) => {
    if (!currentUser) { setShowAuthModal(true); return; }
    const isFav = favourites.includes(id);
    if (isFav) {
      await supabase.from("favourites").delete().eq("user_id", currentUser.id).eq("restaurant_id", id);
      setFavourites(prev => prev.filter(f => f !== id));
    } else {
      await supabase.from("favourites").insert({ user_id: currentUser.id, restaurant_id: id });
      setFavourites(prev => [...prev, id]);
    }
  };

  const handleSaveReview = (restaurantId, review) => {
    setRestaurants(prev => prev.map(r => {
      if (r.id !== restaurantId) return r;
      const exists = r.reviews.find(rev => rev.id === review.id);
      return { ...r, reviews: exists ? r.reviews.map(rev => rev.id === review.id ? review : rev) : [...r.reviews, review] };
    }));
  };

  const handleDeleteReview = async (restaurantId, reviewId) => {
    await supabase.from("reviews").delete().eq("id", reviewId);
    setRestaurants(prev => prev.map(r => r.id !== restaurantId ? r : { ...r, reviews: r.reviews.filter(rev => rev.id !== reviewId) }));
  };

  const handleDeleteRestaurant = async (restaurantId) => {
    await supabase.from("restaurants").delete().eq("id", restaurantId);
    setRestaurants(prev => prev.filter(r => r.id !== restaurantId));
  };

  const handleSelectRestaurant = (restaurant) => {
    setSelectedRestaurantId(restaurant.id);
    setPage("detail");
  };

  const cities = [...new Set(restaurants.map(r => r.city))];
  const filteredRestaurants = restaurants
    .filter(r => filterPrice === "all" || r.price_range === filterPrice)
    .filter(r => filterCity === "all" || r.city === filterCity)
    .sort((a, b) => sortOrder === "desc" ? avg(b.reviews || []) - avg(a.reviews || []) : avg(a.reviews || []) - avg(b.reviews || []));

  const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId);

  if (page === "detail" && selectedRestaurant) {
    return (
      <RestaurantDetail
        restaurant={selectedRestaurant}
        currentUser={currentUser}
        favourites={favourites}
        onToggleFavourite={handleToggleFavourite}
        onSaveReview={handleSaveReview}
        onDeleteReview={handleDeleteReview}
        onDeleteRestaurant={handleDeleteRestaurant}
        onBack={() => setPage("home")}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAF7F2", fontFamily: "Georgia, serif" }}>
      <header style={{ background: "#FAF7F2", borderBottom: "1px solid #EDE5D8", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div onClick={() => setPage("home")} style={{ cursor: "pointer" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#3D2B1F", lineHeight: 1 }}>Tavola per Due</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 10, color: "#B0A090", letterSpacing: 1.5, textTransform: "uppercase" }}>Il nostro diario</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => setPage(page === "favourites" ? "home" : "favourites")} style={{ background: page === "favourites" ? "#3D2B1F" : "transparent", border: `1.5px solid ${page === "favourites" ? "#3D2B1F" : "#DDD4C5"}`, borderRadius: 10, padding: "7px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: page === "favourites" ? "#FAF7F2" : "#8B7355" }}>
              <Icon name="heart" size={14} /><span style={{ fontFamily: "Georgia, serif", fontSize: 12 }}>Preferiti</span>
            </button>
            {currentUser ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#C8956C", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 14 }}>{currentUser.username[0]}</div>
                <button onClick={() => { supabase.auth.signOut(); setCurrentUser(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#8B7355", fontFamily: "Georgia, serif", fontSize: 12 }}>Esci</button>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)} style={{ background: "#3D2B1F", color: "#FAF7F2", border: "none", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 13 }}>Accedi</button>
            )}
          </div>
        </div>
      </header>

      {page === "favourites" ? (
        <FavouritesPage restaurants={restaurants} favourites={favourites} currentUser={currentUser} onToggleFavourite={handleToggleFavourite} onSelectRestaurant={handleSelectRestaurant} />
      ) : (
        <main style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px" }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: "#C8956C", textTransform: "uppercase", letterSpacing: 3, marginBottom: 6 }}>Il nostro diario</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 700, color: "#3D2B1F", lineHeight: 1.15, marginBottom: 8 }}>I ristoranti<br />che amiamo</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 14, color: "#8B7355", fontStyle: "italic" }}>Ogni tavola, una storia. Ogni piatto, un ricordo.</div>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            {currentUser && (
              <button onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "#3D2B1F", color: "#FAF7F2", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 13 }}>
                <Icon name="plus" size={14} /> Aggiungi ristorante
              </button>
            )}
            <button onClick={() => setSortOrder(o => o === "desc" ? "asc" : "desc")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "transparent", color: "#8B7355", border: "1.5px solid #DDD4C5", borderRadius: 10, cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 13 }}>
              <Icon name="sort" size={14} /> {sortOrder === "desc" ? "Voto ↓" : "Voto ↑"}
            </button>
            <button onClick={() => setShowFilters(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: showFilters ? "#3D2B1F" : "transparent", color: showFilters ? "#FAF7F2" : "#8B7355", border: `1.5px solid ${showFilters ? "#3D2B1F" : "#DDD4C5"}`, borderRadius: 10, cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 13 }}>
              <Icon name="filter" size={14} /> Filtri
              {(filterPrice !== "all" || filterCity !== "all") && <span style={{ background: "#C8956C", width: 8, height: 8, borderRadius: "50%", display: "inline-block" }} />}
            </button>
          </div>

          {showFilters && (
            <div style={{ background: "#F0EAE0", borderRadius: 14, padding: "16px 18px", marginBottom: 18 }}>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#8B7355", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontFamily: "sans-serif" }}>Prezzo</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["all", "€", "€€", "€€€"].map(p => (
                      <button key={p} onClick={() => setFilterPrice(p)} style={{ padding: "6px 12px", border: `1.5px solid ${filterPrice === p ? "#C8956C" : "#DDD4C5"}`, borderRadius: 8, background: filterPrice === p ? "#C8956C" : "transparent", color: filterPrice === p ? "#fff" : "#8B7355", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 12 }}>{p === "all" ? "Tutti" : p}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#8B7355", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontFamily: "sans-serif" }}>Città</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["all", ...cities].map(c => (
                      <button key={c} onClick={() => setFilterCity(c)} style={{ padding: "6px 12px", border: `1.5px solid ${filterCity === c ? "#C8956C" : "#DDD4C5"}`, borderRadius: 8, background: filterCity === c ? "#C8956C" : "transparent", color: filterCity === c ? "#fff" : "#8B7355", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 12 }}>{c === "all" ? "Tutte" : c}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#8B7355" }}>Caricamento...</div>
            </div>
          ) : (
            <>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#B0A090", marginBottom: 16 }}>{filteredRestaurants.length} ristoranti trovati</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {filteredRestaurants.map(r => (
                  <RestaurantCard key={r.id} restaurant={r} currentUser={currentUser} favourites={favourites} onToggleFavourite={handleToggleFavourite} onClick={() => handleSelectRestaurant(r)} />
                ))}
              </div>
              {filteredRestaurants.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#B0A090" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🍽️</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#3D2B1F", marginBottom: 8 }}>Nessun ristorante ancora</div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 13, color: "#8B7355" }}>{currentUser ? "Aggiungi il tuo primo ristorante!" : "Accedi per aggiungere ristoranti."}</div>
                </div>
              )}
            </>
          )}
        </main>
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLogin={setCurrentUser} />}
      {showAddModal && currentUser && (
        <AddRestaurantModal onClose={() => setShowAddModal(false)} onAdd={(r) => setRestaurants(prev => [r, ...prev])} currentUser={currentUser} />
      )}
    </div>
  );
}
