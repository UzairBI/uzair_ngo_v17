/**
 * Awards, recognition and recommendation letters. The live list is managed in the admin panel (Awards & Recognition)
 * and read from the database; the list below is what the page shows when the database cannot be reached, and matches
 * what the database starts with (supabase/migrations/20250114000000_awards.sql). Images: public/images/awards/.
 */
export interface Award { id?: number; category: string; title: string; description: string; image_url?: string | null }

/** The groups offered in the admin form and used as filter buttons on the page (in this order). */
export const awardCategories = ["Award / Recognition", "Appreciation", "Recommendation Letter", "Government Reference", "Training Certificate"];

export const defaultAwards: Award[] = [
  { category: "Award / Recognition", title: "Certificate of Excellence – Municipal General Hospital, Mumbai",
    description: "Sahara Jan Kalyan Samiti was honored with the Certificate of Excellence by Municipal General Hospital, Mumbai, for its outstanding contribution to patient welfare, healthcare assistance, and community service.",
    image_url: "/images/awards/award-01.jpg" },
  { category: "Appreciation", title: "Appreciation Letter – Dr. R. N. Cooper General Hospital, Mumbai",
    description: "Dr. R. N. Cooper General Hospital, Municipal Corporation of Greater Mumbai, appreciated Sahara Jan Kalyan Samiti for its generous support and contribution towards patient care facilities.",
    image_url: "/images/awards/award-02.jpg" },
  { category: "Award / Recognition", title: "COVID-19 Vaccination Recognition – MPVHA",
    description: "Recognized by Madhya Pradesh Voluntary Health Association for outstanding support and contribution to the COVID-19 Vaccination Program and public health awareness.",
    image_url: "/images/awards/award-03.jpg" },
  { category: "Recommendation Letter", title: "Government Girls College, Bina Recommendation",
    description: "The Principal of Government Girls College, Bina appreciated Sahara Jan Kalyan Samiti for health awareness, menstrual hygiene, mental health workshops, and student development initiatives.",
    image_url: "/images/awards/award-04.jpg" },
  { category: "Recommendation Letter", title: "HDFC Bank Recommendation Letter",
    description: "HDFC Bank acknowledged the organization’s dedication towards healthcare assistance, educational support, community awareness, and welfare of economically weaker communities.",
    image_url: "/images/awards/award-05.jpg" },
  { category: "Government Reference", title: "Women & Child Development Department – Hindi Reference",
    description: "Issued by the Women & Child Development Department, recognizing the organization’s work in child marriage prevention, awareness campaigns, and grassroots social development.",
    image_url: "/images/awards/award-06.jpg" },
  { category: "Government Reference", title: "Women & Child Development Department – English Reference",
    description: "The department recommended Sahara Jan Kalyan Samiti as a credible and reliable nonprofit organization suitable for CSR partnerships, donations, and development collaborations.",
    image_url: "/images/awards/award-07.jpg" },
  { category: "Training Certificate", title: "MP Jan Abhiyan Parishad Training Certificate",
    description: "Certificate awarded for successful participation in capacity-building training focused on decentralized planning, community participation, social audit, and development monitoring.",
    image_url: "/images/awards/award-08.jpg" },
  { category: "Appreciation", title: "MP Jan Abhiyan Parishad CM Appreciation",
    description: "Recognition for the organization’s significant contribution to Gram Vikas Yatra and rural development activities under Madhya Pradesh Jan Abhiyan Parishad.",
    image_url: "/images/awards/award-09.jpg" },
  { category: "Training Certificate", title: "MP Jan Abhiyan Parishad Capacity Building Certificate",
    description: "Awarded for completing training programs aimed at strengthening voluntary organizations and enhancing community development leadership skills.",
    image_url: "/images/awards/award-10.jpg" },
  { category: "Recommendation Letter", title: "YES Bank Recommendation Letter",
    description: "YES Bank recognized Sahara Jan Kalyan Samiti as a socially responsible nonprofit organization with a strong track record in healthcare, education, community support, and CSR-related initiatives.",
    image_url: "/images/awards/award-11.jpg" },
  { category: "Appreciation", title: "Certificate of Appreciation – Mental Health & Student Welfare Program",
    description: "Government Girls College, Bina appreciated Dr. Shailendra Yadav, Psychologist, Sahara Jan Kalyan Samiti, Sagar, for active support and valuable contribution in the one-day training and awareness program on Mental Health and Student Welfare.",
    image_url: "/images/awards/award-12.jpg" },
  { category: "Award / Recognition", title: "World Record Participation Certificate – Highest Online Yoga Participation 2026",
    description: "Sahara Jan Kalyan Samiti was recognized as an official participant in the global yoga movement organized by Habuild and World Records Union, recording 1.36 Crore+ total attendance from 14–21 June 2026.",
    image_url: "/images/awards/award-13.jpg" },
  { category: "Award / Recognition", title: "NGO Partner Recognition Certificate – I.I.M.U.N. Yoga Initiative 2026",
    description: "India’s International Movement to Unite Nations recognized Sahara Jan Kalyan Samiti for participation as an NGO Partner in I.I.M.U.N.’s Sagar International Yoga Day Initiative 2026.",
    image_url: "/images/awards/award-14.jpg" }
];
