export interface Clipping { image: string; source: string }
export interface Post {
  slug: string; title: string; date: string; category: string; image: string; excerpt: string; body: string[];
  /** Newspaper that carried the story, shown on the card and the story page. */
  source?: string;
  /** Further press clippings of the same story, shown under the main one. */
  more?: Clipping[];
}

/**
 * Add a new story by copying one object below and editing it. Newest first.
 * Keep stories factual: only publish things that have really happened.
 * Images live in public/assets/images/ (press clippings in news/).
 */
export const posts: Post[] = [
  {
    slug: "chess-day-competition-girls-college-bina", title: "International Chess Day: inter-college chess competition at Government Girls College, Bina", date: "2026-07-22", category: "Education",
    image: "news/chess-day-bhumika-bhaskar.jpeg", source: "Bhumika Bhaskar, 22 July 2026",
    excerpt: "On International Chess Day, Sahara Jan Kalyan Samiti organised an inter-college chess competition at Government Girls College, Bina, with support from IIMUN Social Impact.",
    body: [
      "On the occasion of International Chess Day, Sahara Jan Kalyan Samiti, Sagar, organised an inter-college chess competition at Government Girls College, Bina, with the support of IIMUN Social Impact.",
      "Students from several colleges of Sagar district took part and showed their intellectual ability and game skills. The Samiti's president, Dr. Harishankar Sen, spoke as chief guest and said chess is not just a game but a way to build life management, strategic thinking, patience, discipline, decision-making and leadership.",
      "The college principal explained the importance of chess and its origin in the ancient Indian game of chaturanga. The aim of the competition was to build logical thinking, intellectual growth, confidence and a spirit of healthy competition among students. All participants were encouraged at the end of the programme."
    ]
  },
  {
    slug: "cooper-hospital-diagnostic-facilities-kone-india", title: "Modernising diagnostic facilities at Cooper Hospital, Mumbai: KONE India and the Samiti join hands", date: "2026-08-14", category: "Health & Nutrition",
    image: "news/cooper-hospital-lokmat.jpeg", source: "Dainik Lokmat, 14 August 2026",
    excerpt: "KONE India and Sahara Jan Kalyan Samiti are working together to modernise the diagnostic facilities of the Cooper Hospital in Juhu, Mumbai, as reported by Dainik Lokmat.",
    body: [
      "Dainik Lokmat reported on an initiative by KONE India and Sahara Jan Kalyan Samiti to modernise the diagnostic facilities of the Dr. R. N. Cooper Municipal General Hospital in Juhu, Mumbai.",
      "The effort is aimed at improving the hospital's ultrasound diagnostic services so that patients can be examined sooner and more accurately, helping the many families who depend on the hospital for affordable care.",
      "The Samiti continues to work with partners to bring better health care within reach of people who cannot easily afford it."
    ]
  },
  {
    slug: "mental-health-training-girls-college-bina", title: "Mental health and student welfare: one-day training at Government Girls College, Bina", date: "2026-06-03", category: "Health & Nutrition",
    image: "news/mental-health-training-haribhumi.jpeg", source: "Haribhumi, 11 June 2026",
    more: [{ image: "news/mental-health-training-bhumika-bhaskar.jpeg", source: "Bhumika Bhaskar, 6 June 2026" }],
    excerpt: "In cooperation with Sahara Jan Kalyan Samiti, Government Girls College, Bina held a one-day training on mental health and student welfare, with yoga and meditation as a key theme.",
    body: [
      "Government Girls College, Bina, in cooperation with Sahara Jan Kalyan Samiti, Sagar, held a one-day training programme on mental health and student welfare on 3 June 2026.",
      "Students received guidance from experts on mental health, stress management, positive thinking and keeping balance in life. The Samiti's psychologist, Dr. Shailendra Yadav, explained why mental health matters and how pressure from studies, worry about the future and social circumstances can become a cause of stress.",
      "The college principal, Dr. Rashmi Jain, said yoga and meditation play an important role in improving mental health, and the Samiti's president and nodal officer, Dr. Harishankar Sen, encouraged students to talk to teachers, family or experts instead of hiding a problem. A mental health specialist from the primary health centre, Ritu Rajput, also shared practical ways to recognise and manage stress.",
      "The programme aimed to raise awareness among students and to encourage a stress-free life and a healthy, positive learning environment."
    ]
  },
  {
    slug: "world-environment-day-tree-plantation", title: "World Environment Day: tree plantation and awareness programme in Sagar", date: "2026-06-05", category: "Environment",
    image: "news/environment-day-bhumika-bhaskar.jpeg", source: "Bhumika Bhaskar, 6 June 2026",
    excerpt: "On World Environment Day, Sahara Jan Kalyan Samiti organised a tree plantation and environment awareness programme in the city, planting saplings at several places.",
    body: [
      "On World Environment Day, Sahara Jan Kalyan Samiti organised a tree plantation programme in the city of Sagar. Office-bearers and workers of the Samiti took part and planted saplings at several places, carrying the message of environmental protection.",
      "Members told people why trees matter and how rising pollution, climate change and ecological imbalance are a serious challenge for all of humanity. The Samiti's president, Dr. Harishankar Sen, said trees are not only the beauty of nature but the basis of life, and urged everyone to plant and care for saplings for clean air, water conservation and a better future.",
      "Many citizens and workers attended and resolved to make the protection of plants and the environment a people's movement."
    ]
  },
  {
    slug: "relief-material-and-nutrition-support-amawani-ratauna", title: "Relief material and nutrition support for families in Amawani and Ratauna", date: "2026-06-02", category: "Social Relief",
    image: "news/relief-nutrition-bhumika-bhaskar.jpeg", source: "Bhumika Bhaskar, 2 June 2026",
    excerpt: "With Jiv Daya Foundation, the Samiti distributed relief material, clothing and nutrition food to needy rural and tribal families in the Amawani and Ratauna panchayats of Sagar district.",
    body: [
      "With the joint support of Jiv Daya Foundation, Sahara Jan Kalyan Samiti organised a distribution of relief material, clothing and nutrition food in the Amawani and Ratauna panchayats of Sagar district.",
      "Rural tribal and other needy families received sarees, blouses, petticoats, footwear and relief ration. Information was also shared on the Samiti's malnutrition prevention and pre-school education programme, which gives malnourished children regular nutritious food and prepares them for school through play-based early learning.",
      "The Samiti's president, Dr. Harishankar Sen, said the aim is not only to distribute relief but to give lasting support to children and families fighting problems like malnutrition. Volunteers, anganwadi workers, children, women and villagers took part, and villagers thanked the Samiti and Jiv Daya Foundation."
    ]
  },
  {
    slug: "ration-and-clothes-for-tribal-women-rahli", title: "Ration and clothes distributed to tribal women at Rahli", date: "2026-05-31", category: "Social Relief",
    image: "news/ration-clothes-deshbandhu.jpeg", source: "Deshbandhu, 31 May 2026",
    more: [{ image: "news/ration-clothes-patrika.jpeg", source: "Patrika, 31 May 2026" }],
    excerpt: "At a social programme in Rahli, the Samiti gave ration material, sarees, blouses, petticoats and footwear to tribal women, with medical supplies supported by Jiv Daya Foundation.",
    body: [
      "At a social programme organised by Sahara Jan Kalyan Samiti in Rahli, tribal women were given ration material, sarees, blouses, petticoats and shoes and slippers.",
      "The Samiti also distributed medical supplies for the rural community, with support from Jiv Daya Foundation, to help people get primary health assistance. The district Women and Child Development project officer, Mamta Khatik, attended as chief guest, and the Samiti's president, Dr. Harishankar Sen, also took an active part.",
      "Office-bearers said the initiative was taken keeping the immediate needs of tribal women in mind. Villagers praised the Samiti and Jiv Daya Foundation and asked for such community programmes to be held regularly. The Samiti said it will keep running such programmes for people in need in coordination with the local administration."
    ]
  }
];
