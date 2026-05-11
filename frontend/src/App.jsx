import { useEffect, useMemo, useState } from "react";
import "./style.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ADMIN_KEY_STORAGE = "school_admin_key";

export default function App() {
  const [route, setRoute] = useState(window.location.hash === "#admin" ? "admin" : "site");

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash === "#admin" ? "admin" : "site");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return route === "admin" ? <AdminPanel /> : <SchoolSite />;
}

function SchoolSite() {
  const [publicData, setPublicData] = useState({
    notices: [],
    school: {
      name: "Pioneer Public School",
      phone: "9818182996",
      whatsapp: "919818182996",
      address: "B-110, Lal Bagh, Loni, Ghaziabad",
      email: "info@pioneerpublicschoolloni.com",
    },
  });
  const [formStatus, setFormStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePopup, setActivePopup] = useState("admission");
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/public`)
      .then((res) => res.json())
      .then((data) => {
        setPublicData(data);
        if (data.notices?.length) {
          setTimeout(() => setActivePopup("notice"), 1200);
        }
      })
      .catch(() => {});
  }, []);

  const { school, notices } = publicData;
  const phone = school.whatsapp;

  const stats = [
    ["Playway-X", "Classes"],
    ["Smart", "Classrooms"],
    ["1000+", "Library Books"],
    ["Active", "Events & Sports"],
  ];

  const facilities = [
    ["Smart Learning", "Digital classroom support for modern learning."],
    ["Strong Discipline", "Daily routine, manners and value-based habits."],
    ["Activity Based", "Yoga, sports, functions and creative participation."],
    ["Parent Updates", "Easy admission enquiry and direct WhatsApp contact."],
    ["Admin Dashboard", "School can view enquiries and update follow-up status."],
    ["Notice Board", "Owner can add latest notices from backend panel."],
  ];

  const gallery = [
    ["/school/hero.jpg", "School Campus"],
    ["/school/gallery1.jpg", "Yoga Activity"],
    ["/school/gallery2.jpg", "Student Activities"],
    ["/school/gallery4.jpg", "Sports Day"],
    ["/school/gallery5.jpg", "Achievement Day"],
    ["/school/gallery8.jpg", "School Corridor"],
  ];

  async function submitEnquiry(payload, successText) {
    const response = await fetch(`${API_URL}/api/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Enquiry failed");

    setSuccessMessage(successText);
    setActivePopup("success");

    const whatsappText = encodeURIComponent(
      `Admission Enquiry\nStudent: ${payload.studentName || "-"}\nParent: ${payload.parentName}\nMobile: ${payload.mobile}\nClass: ${payload.className}\nAddress: ${payload.address || "-"}\nPrevious School: ${payload.previousSchool || "-"}\nVisit Date: ${payload.visitDate || "-"}\nMessage: ${payload.message || "Please contact me for admission details."}`
    );
    window.open(`https://wa.me/${phone}?text=${whatsappText}`, "_blank", "noreferrer");
  }

  async function sendEnquiry(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormStatus("Sending enquiry...");
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      await submitEnquiry(payload, "Enquiry saved successfully. The school team can now follow up from admin dashboard.");
      form.reset();
      setFormStatus("Enquiry saved successfully.");
    } catch (error) {
      setFormStatus(error.message || "Backend not connected");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function sendPopupForm(event, type) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const payload = {
      studentName: data.studentName || "",
      parentName: data.parentName,
      mobile: data.mobile,
      className: data.className || "Callback",
      address: data.address || "",
      previousSchool: "",
      visitDate: data.visitDate || "",
      message: data.message || type,
    };

    try {
      await submitEnquiry(payload, `${type} request saved successfully.`);
      form.reset();
    } catch (error) {
      setSuccessMessage(error.message || "Request failed");
      setActivePopup("success");
    }
  }

  const latestNotice = notices[0];
  const currentImage = lightboxIndex !== null ? gallery[lightboxIndex] : null;

  return (
    <main className="pps">
      <div className="ppsTop">
        <span>Admissions Open 2026-27</span>
        <span>Playway To Xth Class</span>
        <span>{school.address}</span>
      </div>

      <nav className="ppsNav">
        <a className="ppsBrand" href="#home">
          <img src="/school/icon.png" alt="Pioneer Public School logo" />
          <div><strong>{school.name}</strong><small>Playway To Xth Class</small></div>
        </a>
        <div className="ppsLinks">
          <a href="#about">About</a><a href="#facilities">Facilities</a><a href="#notices">Notices</a>
          <a href="#gallery">Gallery</a><a href="#contact">Contact</a><a href="#admin">Admin</a>
        </div>
        <button className="ppsNavCta" onClick={() => setActivePopup("callback")}>Enquire Now</button>
      </nav>

      <section id="home" className="ppsHero">
        <div className="ppsHeroShade" />
        <div className="ppsHeroInner">
          <div className="ppsHeroText">
            <span className="ppsLabel">Admission Open 2026-27</span>
            <h1>Trusted education for confident young learners.</h1>
            <p>{school.name}, Loni offers disciplined learning, activity-based education, smart classrooms and a caring environment from Playway to Xth class.</p>
            <div className="ppsActions">
              <a href="#contact">Apply For Admission</a>
              <button onClick={() => setActivePopup("brochure")}>Get Brochure</button>
            </div>
          </div>
          <aside className="ppsEnquiryCard">
            <span>For Parents</span><h2>Book a campus visit</h2>
            <p>Talk to the school office and check class availability for the new session.</p>
            <button onClick={() => setActivePopup("visit")}>Book Visit</button>
          </aside>
        </div>
      </section>

      <section className="ppsStats">
        {stats.map(([value, label]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}
      </section>

      <section id="about" className="ppsSection ppsAbout">
        <div><span className="ppsLabel">About The School</span><h2>Built for academics, discipline and overall growth.</h2></div>
        <p>The school focuses on classroom learning, moral values, confidence building, regular activities and parent communication. Every enquiry is saved in the backend so the school team can follow up properly.</p>
      </section>

      <section id="facilities" className="ppsSection ppsFacilities">
        <div className="ppsSectionHead"><span className="ppsLabel">Premium Features</span><h2>A website plus backend system the owner can actually use.</h2></div>
        <div className="ppsFacilityGrid">
          {facilities.map(([title, text]) => <article key={title}><span>✓</span><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>

      <section id="notices" className="ppsSection ppsNoticeSection">
        <div className="ppsSectionHead"><span className="ppsLabel">Notice Board</span><h2>Latest school announcements from backend.</h2></div>
        <div className="ppsNoticeGrid">
          {notices.map((notice) => <article key={notice.id}><span>{notice.category}</span><h3>{notice.title}</h3></article>)}
        </div>
      </section>

      <section className="ppsCampus">
        <div><span className="ppsLabel">Campus Life</span><h2>Real school photos make the website feel genuine.</h2><p>Clean photo sections, admission highlights and direct enquiry buttons help the owner show parents a professional digital presence.</p></div>
        <img src="/school/hero.jpg" alt="Pioneer Public School campus" />
      </section>

      <section id="gallery" className="ppsSection ppsGallery">
        <div className="ppsSectionHead"><span className="ppsLabel">Gallery</span><h2>Click any image to open a premium photo popup.</h2></div>
        <div className="ppsGalleryGrid">
          {gallery.map(([src, title], index) => (
            <button className="ppsGalleryButton" key={title} onClick={() => setLightboxIndex(index)}>
              <img src={src} alt={title} /><h3>{title}</h3>
            </button>
          ))}
        </div>
      </section>

      <section id="admission" className="ppsAdmission">
        <div><span className="ppsLabel">Admission Process</span><h2>Simple enquiry to admission journey.</h2></div>
        <div className="ppsSteps">
          <article><b>01</b><h3>Enquiry</h3><p>Form details save in backend.</p></article>
          <article><b>02</b><h3>Follow-up</h3><p>Office team contacts parent.</p></article>
          <article><b>03</b><h3>Visit</h3><p>Parent visits school campus.</p></article>
          <article><b>04</b><h3>Admission</h3><p>Final admission is confirmed.</p></article>
        </div>
      </section>

      <section id="contact" className="ppsContact">
        <div>
          <span className="ppsLabel">Contact</span><h2>Start admission enquiry</h2>
          <p><b>Address:</b> {school.address}</p><p><b>Phone:</b> {school.phone} / 9810038160</p><p><b>Email:</b> {school.email}</p>
        </div>
        <form onSubmit={sendEnquiry}>
          <input name="studentName" placeholder="Student name" />
          <input name="parentName" placeholder="Parent name" required />
          <input name="mobile" placeholder="Mobile number" required />
          <input name="className" placeholder="Class for admission" required />
          <input name="address" placeholder="Address" />
          <input name="previousSchool" placeholder="Previous school" />
          <input name="visitDate" type="date" />
          <textarea name="message" placeholder="Message" />
          <button disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Send Enquiry"}</button>
          {formStatus && <p className="ppsFormStatus">{formStatus}</p>}
        </form>
      </section>

      <div className="ppsFloatingTools">
        <button onClick={() => setActivePopup("callback")}>Call Back</button>
        <button onClick={() => setActivePopup("visit")}>Visit</button>
        <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">WhatsApp</a>
      </div>

      <footer className="ppsFooter"><h2>{school.name}</h2><p>Modern Education | Discipline | Student Growth</p></footer>

      {activePopup === "admission" && (
        <Modal onClose={() => setActivePopup("")}>
          <span className="popupTag">Admissions Open</span>
          <h2>Admissions Open For 2026-27</h2>
          <p>Register early for Playway to Xth class and book a campus visit with the school office.</p>
          <div className="popupActions"><a href="#contact" onClick={() => setActivePopup("")}>Apply Now</a><button onClick={() => setActivePopup("callback")}>Request Callback</button></div>
        </Modal>
      )}

      {activePopup === "notice" && latestNotice && (
        <Modal onClose={() => setActivePopup("")}>
          <span className="popupTag">Latest Notice</span>
          <h2>{latestNotice.title}</h2>
          <p>This notice is coming from the backend notice board. Owner can change it from admin dashboard.</p>
          <div className="popupActions"><a href="#notices" onClick={() => setActivePopup("")}>View Notices</a><button onClick={() => setActivePopup("")}>Close</button></div>
        </Modal>
      )}

      {activePopup === "callback" && (
        <Modal onClose={() => setActivePopup("")}>
          <span className="popupTag">Request Callback</span>
          <h2>Get a call from school office</h2>
          <PopupForm submitText="Request Callback" onSubmit={(e) => sendPopupForm(e, "Callback")} />
        </Modal>
      )}

      {activePopup === "visit" && (
        <Modal onClose={() => setActivePopup("")}>
          <span className="popupTag">Campus Visit</span>
          <h2>Book your school visit</h2>
          <PopupForm showDate submitText="Book Visit" onSubmit={(e) => sendPopupForm(e, "Campus Visit")} />
        </Modal>
      )}

      {activePopup === "brochure" && (
        <Modal onClose={() => setActivePopup("")}>
          <span className="popupTag">School Brochure</span>
          <h2>Get admission brochure on WhatsApp</h2>
          <PopupForm submitText="Get Brochure" onSubmit={(e) => sendPopupForm(e, "Brochure Request")} />
        </Modal>
      )}

      {activePopup === "success" && (
        <Modal onClose={() => setActivePopup("")}>
          <span className="popupTag">Success</span>
          <h2>Request submitted</h2>
          <p>{successMessage}</p>
          <div className="popupActions"><button onClick={() => setActivePopup("")}>Done</button></div>
        </Modal>
      )}

      {currentImage && (
        <div className="lightbox" role="dialog" aria-modal="true">
          <button className="lightboxClose" onClick={() => setLightboxIndex(null)}>×</button>
          <button className="lightboxArrow lightboxPrev" onClick={() => setLightboxIndex((lightboxIndex + gallery.length - 1) % gallery.length)}>‹</button>
          <img src={currentImage[0]} alt={currentImage[1]} />
          <button className="lightboxArrow lightboxNext" onClick={() => setLightboxIndex((lightboxIndex + 1) % gallery.length)}>›</button>
          <div className="lightboxCaption">{currentImage[1]}</div>
        </div>
      )}
    </main>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="popupOverlay" role="dialog" aria-modal="true">
      <div className="popupCard">
        <button className="popupClose" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
}

function PopupForm({ onSubmit, submitText, showDate = false }) {
  return (
    <form className="popupForm" onSubmit={onSubmit}>
      <input name="parentName" placeholder="Parent name" required />
      <input name="mobile" placeholder="Mobile number" required />
      <input name="className" placeholder="Class for admission" />
      {showDate && <input name="visitDate" type="date" />}
      <textarea name="message" placeholder="Message" />
      <button>{submitText}</button>
    </form>
  );
}

function AdminPanel() {
  const [adminKey, setAdminKey] = useState(localStorage.getItem(ADMIN_KEY_STORAGE) || "");
  const [summary, setSummary] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [notices, setNotices] = useState([]);
  const [message, setMessage] = useState("");

  const headers = useMemo(() => ({ "Content-Type": "application/json", "x-admin-key": adminKey }), [adminKey]);

  async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  }

  async function loadAdmin(event) {
    event?.preventDefault();
    localStorage.setItem(ADMIN_KEY_STORAGE, adminKey);
    setMessage("Loading dashboard...");
    try {
      const [summaryData, enquiryData, noticeData] = await Promise.all([
        request("/api/admin/summary"),
        request("/api/admin/enquiries"),
        request("/api/admin/notices"),
      ]);
      setSummary(summaryData);
      setEnquiries(enquiryData.enquiries);
      setNotices(noticeData.notices);
      setMessage("Dashboard loaded");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateStatus(id, status) {
    try {
      const data = await request(`/api/admin/enquiries/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setEnquiries((items) => items.map((item) => (item.id === id ? data.enquiry : item)));
      setMessage("Status updated");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function addNotice(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const data = await request("/api/admin/notices", { method: "POST", body: JSON.stringify(payload) });
      setNotices((items) => [data.notice, ...items]);
      form.reset();
      setMessage("Notice added");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteNotice(id) {
    try {
      await request(`/api/admin/notices/${id}`, { method: "DELETE" });
      setNotices((items) => items.filter((item) => item.id !== id));
      setMessage("Notice deleted");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="adminPage">
      <section className="adminHero">
        <a href="#" className="adminBack">Back to Website</a>
        <span>School Admin</span>
        <h1>Admission Dashboard</h1>
        <p>View enquiries, update follow-up status and manage notice board content.</p>
      </section>

      <section className="adminPanel">
        <form onSubmit={loadAdmin} className="adminLogin">
          <input type="password" placeholder="Admin key" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} required />
          <button>Load Dashboard</button>
        </form>
        {message && <p className="adminMessage">{message}</p>}

        {summary && (
          <div className="adminStats">
            <article><strong>{summary.totalEnquiries}</strong><span>Total Enquiries</span></article>
            <article><strong>{summary.newEnquiries}</strong><span>New</span></article>
            <article><strong>{summary.contacted}</strong><span>Contacted</span></article>
            <article><strong>{summary.admitted}</strong><span>Admitted</span></article>
          </div>
        )}

        <div className="adminSplit">
          <section>
            <h2>Notice Board</h2>
            <form onSubmit={addNotice} className="noticeForm">
              <input name="title" placeholder="Notice title" required />
              <input name="category" placeholder="Category" />
              <button>Add Notice</button>
            </form>
            <div className="noticeList">
              {notices.map((notice) => (
                <article key={notice.id}>
                  <span>{notice.category}</span><h3>{notice.title}</h3>
                  <button onClick={() => deleteNotice(notice.id)}>Delete</button>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h2>Parent Enquiries</h2>
            <div className="adminGrid">
              {enquiries.map((item) => (
                <article className="adminCard" key={item.id}>
                  <div><span>{item.status}</span><small>{new Date(item.createdAt).toLocaleString()}</small></div>
                  <h3>{item.parentName}</h3>
                  <p><b>Student:</b> {item.studentName || "-"}</p>
                  <p><b>Mobile:</b> {item.mobile}</p>
                  <p><b>Class:</b> {item.className}</p>
                  <p><b>Address:</b> {item.address || "-"}</p>
                  <p><b>Visit:</b> {item.visitDate || "-"}</p>
                  <p><b>Message:</b> {item.message || "-"}</p>
                  <select value={item.status} onChange={(e) => updateStatus(item.id, e.target.value)}>
                    <option value="new">New</option><option value="contacted">Contacted</option>
                    <option value="visited">Visited</option><option value="admitted">Admitted</option><option value="closed">Closed</option>
                  </select>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}