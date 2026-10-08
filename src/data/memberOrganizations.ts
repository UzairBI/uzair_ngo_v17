/**
 * Member organisations of the Samiti's network (Membership -> Memberships, /memberships). The live list is managed in the
 * admin panel (Member Organizations, table member_organizations); the three below are shown only until that table can be read.
 */
export interface MemberOrganization { id: string; name: string; location: string; description: string }

export const defaultMemberOrganizations: MemberOrganization[] = [
  { id: "d1", name: "YAJUR Foundation", location: "Sagar, Madhya Pradesh", description: "Working in healthcare awareness and rural medical support programs." },
  { id: "d2", name: "Sumardha Trust", location: "Rehli, Sagar, Madhya Pradesh", description: "Focused on education, digital literacy, and youth empowerment." },
  { id: "d3", name: "Rural Development Society", location: "Chhatarpur, Madhya Pradesh", description: "Engaged in livelihood development and women self-help group initiatives." }
];
