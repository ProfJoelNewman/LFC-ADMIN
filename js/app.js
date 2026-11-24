/**
 * LFC HUB (CHMS v2.0) — Mobile-First Client Application
 * 3-System Architecture: WordPress (deltonanaz.com) + GitHub Pages + Google Drive Vault
 */
(function () {
  'use strict';

  const CFG = window.LFC_CHMS_CONFIG;
  const STORAGE_KEYS = {
    GAS_URL: 'lfc_chms_gas_url_v2',
    SESSION_TOKEN: 'lfc_chms_session_token_v2',
    THEME: 'lfc_chms_theme_v2'
  };

  // SVG Icons for Mobile Bottom Navigation
  const ICONS = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1v-9.5z"/></svg>',
    attendance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>',
    visitors: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2M15 12h2M7 16h10"/></svg>',
    worship: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    finance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
    reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.3l7.8-7.8 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>'
  };

  // Application Runtime State
  const state = {
    mode: 'staff', // 'staff' | 'public' | 'worship_public' | 'rsvp'
    isSimulated: false,
    gasUrl: localStorage.getItem(STORAGE_KEYS.GAS_URL) || CFG.defaultGasWebAppUrl || '',
    sessionToken: localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN) || '',
    user: null,
    activeTab: 'home',
    subTab: '',
    reportMonth: '2026-11',
    selectedSongId: 'sng_firm',
    selectedKey: 'G',
    chordFontSize: 15,
    showChords: true,
    attMinistry: 'Sunday Worship - Adults',
    attHeadcountAdults: 79,
    attHeadcountKids: 34,
    attFirstTimers: 2,
    attUnnamedGuests: 4,
    attRosterChecked: { p_patricia: true, p_huney: true, p_danielle: true },
    selectedBatchId: 'bat_1120_stripe',
    pendingPhotoBase64: '',
    pendingPhotoName: '',
    dirQuery: '',
    dirStatusFilter: 'All',
    statementDonor: 'Patricia Babb',
    rsvpToken: '',
    rsvpAssignment: null,
    data: createDemoVaultData()
  };

  function createDemoVaultData() {
    return {
      vaultLinks: {
        vaultFolder: CFG.vault.folderUrl,
        wb01Auth: CFG.vault.workbooks.auth.url,
        wb02People: CFG.vault.workbooks.people.url,
        wb03Worship: CFG.vault.workbooks.worship.url,
        wb04Finance: CFG.vault.workbooks.finance.url
      },
      pilotFeedback: [],
      users: [
        { userId: 'usr_joel', username: 'PastorJoel', fullName: 'Pastor Joel Newman', email: 'pastor@deltonanaz.com', phone: '(386) 574-7828', role: 'super_admin', allowedModules: '*', ministryScopes: '*', active: true },
        { userId: 'usr_april', username: 'april.newman', fullName: "April Newman (Children's, SHIELD & SCA)", email: 'shield@deltonanaz.com', phone: '', role: 'ministry_director', allowedModules: 'dashboard,attendance,visitors,schedules,reports', ministryScopes: 'Children, SHIELD Ministry, SHIELD Christian Academy, Sunday School', active: true },
        { userId: 'usr_yaresly', username: 'yaresly.godwin', fullName: 'Yaresly Godwin (Board Secretary)', email: 'boardsecretary@deltonanaz.com', phone: '', role: 'super_admin', allowedModules: '*', ministryScopes: '*', active: true },
        { userId: 'usr_huney', username: 'huney.treasurer', fullName: 'Dee "Huney" Huchton (Treasurer)', email: 'treasurer@deltonanaz.com', phone: '', role: 'treasurer', allowedModules: 'dashboard,giving,accounting,friday,reports', ministryScopes: 'All Financial', active: true },
        { userId: 'usr_wayne', username: 'wayne.worship', fullName: 'Wayne Crev (Worship Head)', email: 'worship@deltonanaz.com', phone: '', role: 'worship_leader', allowedModules: 'dashboard,worship,worship_stage,events,schedules', ministryScopes: 'Sunday Worship,Audio Visual', active: true },
        { userId: 'usr_patricia', username: 'patricia.board', fullName: 'Patricia Babb (Church Board)', email: 'board@deltonanaz.com', phone: '', role: 'board_member', allowedModules: 'dashboard,reports,schedules_my', ministryScopes: 'Church Board', active: true },
        { userId: 'usr_sarah', username: 'sarah.kids', fullName: "Sarah Gulick (Children's Helper)", email: 'kids@deltonanaz.com', phone: '', role: 'ministry_helper', allowedModules: 'dashboard,attendance,schedules_my', ministryScopes: 'Children', active: true },
        { userId: 'usr_counter', username: 'sunday.counter', fullName: 'Sunday Offering Counter', email: 'counter@deltonanaz.com', phone: '', role: 'offering_counter', allowedModules: 'dashboard,giving_batch_entry', ministryScopes: 'Sunday Worship', active: true }
      ],
      people: [
        { Person_ID: 'p_joel', First_Name: 'Joel', Last_Name: 'Newman', Member_Status: 'Voting Member', Active_Roll: 'Yes', Age_Category: 'Adults', Mobile_Phone: '(386) 574-7828', Email: 'pastor@deltonanaz.com', Role_Note: 'Lead Pastor' },
        { Person_ID: 'p_april', First_Name: 'April', Last_Name: 'Newman', Member_Status: 'Voting Member', Active_Roll: 'Yes', Age_Category: 'Adults', Mobile_Phone: '', Email: '', Role_Note: "Children's, SHIELD Ministry & SCA Director" },
        { Person_ID: 'p_yaresly', First_Name: 'Yaresly', Last_Name: 'Godwin', Member_Status: 'Voting Member', Active_Roll: 'Yes', Age_Category: 'Adults', Mobile_Phone: '', Email: '', Role_Note: 'Church Board Secretary' },
        { Person_ID: 'p_huney', First_Name: 'Dee "Huney"', Last_Name: 'Huchton', Member_Status: 'Voting Member', Active_Roll: 'Yes', Age_Category: 'Adults', Mobile_Phone: '', Email: '', Role_Note: 'Church Treasurer' },
        { Person_ID: 'p_wayne', First_Name: 'Wayne', Last_Name: 'Crev', Member_Status: 'Voting Member', Active_Roll: 'Yes', Age_Category: 'Adults', Mobile_Phone: '', Email: '', Role_Note: 'Worship Leader & Area Head' },
        { Person_ID: 'p_patricia', First_Name: 'Patricia', Last_Name: 'Babb', Member_Status: 'Voting Member', Active_Roll: 'Yes', Age_Category: 'Adults', Mobile_Phone: '', Email: '', Role_Note: 'Church Board Member' },
        { Person_ID: 'p_sarah', First_Name: 'Sarah', Last_Name: 'Gulick', Member_Status: 'Voting Member', Active_Roll: 'Yes', Age_Category: 'Adults', Mobile_Phone: '', Email: '', Role_Note: "Children's Helper" },
        { Person_ID: 'p_kid_1', First_Name: 'Lucas', Last_Name: 'Sample-Child', Member_Status: 'Child', Active_Roll: 'Yes', Age_Category: 'Child / Youth', Mobile_Phone: '(386) 555-0141', Email: '', Role_Note: 'Kids Worship Check-In Demo' },
        { Person_ID: 'p_kid_2', First_Name: 'Hannah', Last_Name: 'Sample-Child', Member_Status: 'Child', Active_Roll: 'Yes', Age_Category: 'Child / Youth', Mobile_Phone: '(386) 555-0142', Email: '', Role_Note: 'LFC Kids Club Demo' },
        { Person_ID: 'p_vis_1', First_Name: 'Jordan', Last_Name: 'Sample-Guest', Member_Status: 'Visitor', Active_Roll: 'Yes', Age_Category: 'Adults', Mobile_Phone: '(386) 555-0151', Email: '', Role_Note: 'Sunday Visitor Demo' },
        { Person_ID: 'p_fup_1', First_Name: 'Taylor', Last_Name: 'Sample-Care', Member_Status: 'AWOL (Needs F-UP)', Active_Roll: 'No', Age_Category: 'Adults', Mobile_Phone: '(386) 555-0152', Email: '', Role_Note: 'Pastoral Follow-Up Demo' }
      ],
      visitors: [
        { Submission_ID: 'vis_01', Month_Key: '2026-10', Visit_Date: '2026-10-18', Full_Name: 'Marcus & Elena Rivera', Phone: '(386) 555-0162', Guest_Status: '1st Time Visitor', Ministry_Source: 'Sunday Worship', Decision_Today: 'Profession of Faith', Prayer_Request: 'New job in Volusia County', Follow_Up_Status: 'Completed', Card_Scan_Drive_URL: '' },
        { Submission_ID: 'vis_02', Month_Key: '2026-10', Visit_Date: '2026-10-25', Full_Name: 'Marcus & Elena Rivera', Phone: '(386) 555-0162', Guest_Status: '2nd Time Visitor', Ministry_Source: 'Sunday Worship', Decision_Today: 'Baptism Interest', Prayer_Request: '', Follow_Up_Status: 'Completed', Card_Scan_Drive_URL: '' },
        { Submission_ID: 'vis_03', Month_Key: '2026-11', Visit_Date: '2026-11-15', Full_Name: 'Dale Winters', Phone: '(386) 555-0178', Guest_Status: '1st Time Visitor', Ministry_Source: 'Sunday Worship', Decision_Today: 'None', Prayer_Request: 'Thankful to worship with Jody', Follow_Up_Status: 'Completed', Card_Scan_Drive_URL: '' },
        { Submission_ID: 'vis_04', Month_Key: '2026-11', Visit_Date: '2026-11-18', Full_Name: 'Amber Hattaway', Phone: '(386) 555-0188', Guest_Status: '2nd Time Visitor', Ministry_Source: 'Celebrate Recovery', Decision_Today: 'Speak with Pastor', Prayer_Request: 'Prayers for family peace and comfort', Follow_Up_Status: 'Pending', Card_Scan_Drive_URL: '' },
        { Submission_ID: 'vis_05', Month_Key: '2026-11', Visit_Date: '2026-11-22', Full_Name: 'Trevor & Kayla Brooks', Phone: '(386) 555-0194', Guest_Status: '1st Time Visitor', Ministry_Source: 'Sunday Worship', Decision_Today: 'Profession of Faith', Prayer_Request: 'Kids loved Sunday School!', Follow_Up_Status: 'Pending', Card_Scan_Drive_URL: '' }
      ],
      attendanceSessions: [
        { Session_ID: 'att_1018_a', Month_Key: '2026-10', Session_Date: '2026-10-18', Ministry_Category: 'Sunday Worship - Adults', Total_Attendance: 69, First_Time_Visitors: 2 },
        { Session_ID: 'att_1018_k', Month_Key: '2026-10', Session_Date: '2026-10-18', Ministry_Category: 'Sunday Worship - Children', Total_Attendance: 28, First_Time_Visitors: 1 },
        { Session_ID: 'att_1018_ss', Month_Key: '2026-10', Session_Date: '2026-10-18', Ministry_Category: 'Sunday School', Total_Attendance: 24, First_Time_Visitors: 1 },
        { Session_ID: 'att_1021_cr', Month_Key: '2026-10', Session_Date: '2026-10-21', Ministry_Category: 'Celebrate Recovery', Total_Attendance: 42, First_Time_Visitors: 2 },
        { Session_ID: 'att_1021_sh', Month_Key: '2026-10', Session_Date: '2026-10-21', Ministry_Category: 'SHIELD Ministry', Total_Attendance: 29, First_Time_Visitors: 0 },
        { Session_ID: 'att_1025_a', Month_Key: '2026-10', Session_Date: '2026-10-25', Ministry_Category: 'Sunday Worship - Adults', Total_Attendance: 71, First_Time_Visitors: 0 },
        { Session_ID: 'att_1025_k', Month_Key: '2026-10', Session_Date: '2026-10-25', Ministry_Category: 'Sunday Worship - Children', Total_Attendance: 30, First_Time_Visitors: 0 },
        { Session_ID: 'att_1108_a', Month_Key: '2026-11', Session_Date: '2026-11-08', Ministry_Category: 'Sunday Worship - Adults', Total_Attendance: 76, First_Time_Visitors: 1 },
        { Session_ID: 'att_1108_k', Month_Key: '2026-11', Session_Date: '2026-11-08', Ministry_Category: 'Sunday Worship - Children', Total_Attendance: 33, First_Time_Visitors: 0 },
        { Session_ID: 'att_1115_a', Month_Key: '2026-11', Session_Date: '2026-11-15', Ministry_Category: 'Sunday Worship - Adults', Total_Attendance: 73, First_Time_Visitors: 1 },
        { Session_ID: 'att_1115_k', Month_Key: '2026-11', Session_Date: '2026-11-15', Ministry_Category: 'Sunday Worship - Children', Total_Attendance: 31, First_Time_Visitors: 0 },
        { Session_ID: 'att_1115_ss', Month_Key: '2026-11', Session_Date: '2026-11-15', Ministry_Category: 'Sunday School', Total_Attendance: 25, First_Time_Visitors: 0 },
        { Session_ID: 'att_1118_cr', Month_Key: '2026-11', Session_Date: '2026-11-18', Ministry_Category: 'Celebrate Recovery', Total_Attendance: 45, First_Time_Visitors: 1 },
        { Session_ID: 'att_1118_sh', Month_Key: '2026-11', Session_Date: '2026-11-18', Ministry_Category: 'SHIELD Ministry', Total_Attendance: 32, First_Time_Visitors: 1 },
        { Session_ID: 'att_1122_a', Month_Key: '2026-11', Session_Date: '2026-11-22', Ministry_Category: 'Sunday Worship - Adults', Total_Attendance: 79, First_Time_Visitors: 2 },
        { Session_ID: 'att_1122_k', Month_Key: '2026-11', Session_Date: '2026-11-22', Ministry_Category: 'Sunday Worship - Children', Total_Attendance: 34, First_Time_Visitors: 2 },
        { Session_ID: 'att_1122_ss', Month_Key: '2026-11', Session_Date: '2026-11-22', Ministry_Category: 'Sunday School', Total_Attendance: 29, First_Time_Visitors: 2 },
        { Session_ID: 'att_1125_cr', Month_Key: '2026-11', Session_Date: '2026-11-25', Ministry_Category: 'Celebrate Recovery', Total_Attendance: 47, First_Time_Visitors: 2 },
        { Session_ID: 'att_1125_sh', Month_Key: '2026-11', Session_Date: '2026-11-25', Ministry_Category: 'SHIELD Ministry', Total_Attendance: 35, First_Time_Visitors: 1 }
      ],
      events: [
        { Event_ID: 'ev_sun_20261122', Title: 'Sunday AM Praise & Worship', Ministry_Scope: 'Sunday Worship', Event_Date: '2026-11-22', Start_Time: '10:30 AM', Location: 'Worship Center', Published_Public: 'Yes', Sermon_or_Topic: 'Stepping Into the Waters (Joshua 3:1-17)' },
        { Event_ID: 'ev_shield_20261125', Title: 'LFC Kids Club & SHIELD Youth', Ministry_Scope: 'SHIELD Ministry', Event_Date: '2026-11-25', Start_Time: '6:00 PM', Location: 'Activity Center', Published_Public: 'Yes', Sermon_or_Topic: 'Dinner & Bible Classes' },
        { Event_ID: 'ev_cr_20261125', Title: 'Celebrate Recovery', Ministry_Scope: 'Celebrate Recovery', Event_Date: '2026-11-25', Start_Time: '7:00 PM', Location: 'Worship Center', Published_Public: 'Yes', Sermon_or_Topic: 'Christ-Centered Recovery' },
        { Event_ID: 'ev_sun_20261129', Title: 'First Sunday of Advent Worship', Ministry_Scope: 'Sunday Worship', Event_Date: '2026-11-29', Start_Time: '10:30 AM', Location: 'Worship Center', Published_Public: 'Yes', Sermon_or_Topic: 'Hope Has Come (Isaiah 9:2-7)' },
        { Event_ID: 'ev_yardsale_1205', Title: 'LFC Community Yard Sale & Outreach', Ministry_Scope: 'Special Event', Event_Date: '2026-12-05', Start_Time: '8:00 AM', Location: 'Church Grounds', Published_Public: 'Yes', Sermon_or_Topic: 'Vendor Tables Open' }
      ],
      songs: [
        {
          Song_ID: 'sng_firm',
          Title: "Firm Foundation (He Won't)",
          Authors: 'Cody Carnes, Austin Davis, Chandler Moore',
          CCLI_Number: '7188203',
          Default_Key: 'G',
          BPM: 75,
          ChordPro_Chart: "{c: Verse 1}\nChrist is my [G]firm foundation\nThe [Em]rock on which I [D]stand\nWhen everything a[G]round me is shaken\nI've [Em]never been more [D]glad\nThat I [C]put my faith in [G/B]Jesus\n'Cause He's [Em]never let me [D]down\n\n{c: Chorus}\nHe [G]won't, He [Gsus]won't\nI've [Em]still got [D]joy in [C]chaos\nI've got [G/B]peace that makes no [D]sense\nSo [C]I won't be [G/B]going [Em]under\nI'm not [D]held by my own [G]strength"
        },
        {
          Song_ID: 'sng_holy',
          Title: 'Holy Forever',
          Authors: 'Brian Johnson, Chris Tomlin, Phil Wickham',
          CCLI_Number: '7201044',
          Default_Key: 'G',
          BPM: 72,
          ChordPro_Chart: "{c: Chorus}\nYour name is the [C]highest\nYour name is the [G]greatest\nYour name [Em]stands above them [D]all\nAnd the [C]angels cry, [Em]Ho-[D]ly\nAll cre[G/B]ation cries, [Em]Ho-[C]ly\nYou are [Am]lifted high, [D]Ho-ly\nHoly for[G]ever"
        },
        {
          Song_ID: 'sng_battle',
          Title: 'Battle Belongs',
          Authors: 'Brian Johnson, Phil Wickham',
          CCLI_Number: '7148126',
          Default_Key: 'Db',
          BPM: 81,
          ChordPro_Chart: "{c: Verse 1}\nWhen [Db]all I see is the battle\nYou [Gb]see my victory\nWhen [Bbm]all I see is the mountain\nYou [Ab]see a mountain [Gb]moved\n\n{c: Chorus}\nSo when I [Gb]fight, I'll fight on my [Db]knees\nWith my hands lifted [Ab]high\nOh [Bbm]God, the battle be[Gb]longs to [Db]You [Ab]"
        },
        {
          Song_ID: 'sng_death',
          Title: 'Death Was Arrested',
          Authors: 'North Point Worship',
          CCLI_Number: '7046448',
          Default_Key: 'B',
          BPM: 76,
          ChordPro_Chart: "{c: Verse 1}\nA[B]lone in my sorrow and [E]dead in my [B]sin\nLost without [G#m]hope with no [F#]place to be[E]gin\nYour love made a [B]way to let [E]mercy come [B]in\nWhen [G#m]death was ar[F#]rested and my [E]life be[B]gan"
        }
      ],
      outlines: [
        { Item_ID: 'out_01', Event_ID: 'ev_sun_20261129', Sort_Order: 1, Item_Type: 'element', Song_ID: '', Title: '5-Minute Sacred Gold Countdown', Selected_Key: '', Duration_Sec: 300, Led_By: 'Audio Visual Team' },
        { Item_ID: 'out_02', Event_ID: 'ev_sun_20261129', Sort_Order: 2, Item_Type: 'element', Song_ID: '', Title: 'Welcome & Advent Candle Lighting', Selected_Key: '', Duration_Sec: 300, Led_By: 'Wayne Crev' },
        { Item_ID: 'out_03', Event_ID: 'ev_sun_20261129', Sort_Order: 3, Item_Type: 'song', Song_ID: 'sng_firm', Title: "Firm Foundation (He Won't)", Selected_Key: 'G', Duration_Sec: 330, Led_By: 'Wayne Crev & Worship Team' },
        { Item_ID: 'out_04', Event_ID: 'ev_sun_20261129', Sort_Order: 4, Item_Type: 'song', Song_ID: 'sng_death', Title: 'Death Was Arrested', Selected_Key: 'B', Duration_Sec: 310, Led_By: 'Wayne Crev & Worship Team' },
        { Item_ID: 'out_05', Event_ID: 'ev_sun_20261129', Sort_Order: 5, Item_Type: 'element', Song_ID: '', Title: 'Pastoral Prayer & Tithes/Offerings', Selected_Key: '', Duration_Sec: 300, Led_By: 'Pastor Joel Newman' },
        { Item_ID: 'out_06', Event_ID: 'ev_sun_20261129', Sort_Order: 6, Item_Type: 'song', Song_ID: 'sng_holy', Title: 'Holy Forever', Selected_Key: 'Bb', Duration_Sec: 320, Led_By: 'Wayne Crev (Transposed G -> Bb)' },
        { Item_ID: 'out_07', Event_ID: 'ev_sun_20261129', Sort_Order: 7, Item_Type: 'element', Song_ID: '', Title: 'Sermon: Hope Has Come (Isaiah 9:2-7)', Selected_Key: '', Duration_Sec: 2100, Led_By: 'Pastor Joel Newman' },
        { Item_ID: 'out_08', Event_ID: 'ev_sun_20261129', Sort_Order: 8, Item_Type: 'song', Song_ID: 'sng_battle', Title: 'Battle Belongs', Selected_Key: 'Db', Duration_Sec: 290, Led_By: 'Wayne Crev & Worship Team' }
      ],
      schedules: [
        { Assignment_ID: 'asg_01', Event_Date: '2026-11-29', Event_Title: 'First Sunday of Advent Worship', Helper_Username: 'wayne.worship', Helper_Name: 'Wayne Crev', Role_Title: 'Worship Leader & Area Head', RSVP_Status: 'Accepted', RSVP_Token: 'tok_wayne_1129' },
        { Assignment_ID: 'asg_02', Event_Date: '2026-11-29', Event_Title: 'First Sunday of Advent Worship', Helper_Username: 'leandra.worship', Helper_Name: 'Leandra Crevoiserat', Role_Title: 'Vocalist', RSVP_Status: 'Accepted', RSVP_Token: 'tok_leandra_1129' },
        { Assignment_ID: 'asg_03', Event_Date: '2026-11-29', Event_Title: 'First Sunday of Advent Worship', Helper_Username: 'lawton.av', Helper_Name: 'Lawton Stacey', Role_Title: 'Graphics / Stream Operator', RSVP_Status: 'Invited', RSVP_Token: 'tok_lawton_1129' },
        { Assignment_ID: 'asg_07', Event_Date: '2026-11-29', Event_Title: "SHIELD Kids, Youth & SCA Oversight", Helper_Username: 'april.newman', Helper_Name: 'April Newman', Role_Title: "Children's, SHIELD & SCA Director", RSVP_Status: 'Accepted', RSVP_Token: 'tok_april_1129' },
        { Assignment_ID: 'asg_04', Event_Date: '2026-11-29', Event_Title: "Children's Ministry Check-In", Helper_Username: 'sarah.kids', Helper_Name: 'Sarah Gulick', Role_Title: "Children's Helper", RSVP_Status: 'Accepted', RSVP_Token: 'tok_sarah_1129' },
        { Assignment_ID: 'asg_05', Event_Date: '2026-12-08', Event_Title: 'Monthly Church Board Meeting', Helper_Username: 'patricia.board', Helper_Name: 'Patricia Babb', Role_Title: 'Church Board Member', RSVP_Status: 'Accepted', RSVP_Token: 'tok_patricia_1208' },
        { Assignment_ID: 'asg_06', Event_Date: '2026-12-08', Event_Title: 'Monthly Church Board Meeting', Helper_Username: 'yaresly.godwin', Helper_Name: 'Yaresly Godwin', Role_Title: 'Church Board Secretary', RSVP_Status: 'Accepted', RSVP_Token: 'tok_yaresly_1208' }
      ],
      givingBatches: [
        { Batch_ID: 'bat_1108_sun', Month_Key: '2026-11', Batch_Date: '2026-11-08', Batch_Type: 'In-Person Giving', Description: 'November 8, 2026 (Sunday Offering)', Locked: 'Yes', Count_Sheet_Drive_URL: '' },
        { Batch_ID: 'bat_1115_sun', Month_Key: '2026-11', Batch_Date: '2026-11-15', Batch_Type: 'In-Person Giving', Description: 'November 15, 2026 (Sunday Offering)', Locked: 'Yes', Count_Sheet_Drive_URL: '' },
        { Batch_ID: 'bat_1120_stripe', Month_Key: '2026-11', Batch_Date: '2026-11-20', Batch_Type: 'Online Giving', Description: 'November 20, 2026 (Open Batch)', Locked: 'No', Count_Sheet_Drive_URL: '' }
      ],
      contributions: [
        { Contribution_ID: 'cnt_01', Month_Key: '2026-10', Gift_Date: '2026-10-13', Batch_ID: 'bat_1013', Donor_Name: 'Joel Newman', Amount: 255.93, Category_Code: '10-2002', Category_Name: 'In-Kind Donation', Fund_Code: '10', Payment_Type: 'In-Kind' },
        { Contribution_ID: 'cnt_02', Month_Key: '2026-11', Gift_Date: '2026-11-08', Batch_ID: 'bat_1108_sun', Donor_Name: 'Joel Newman', Amount: 450, Category_Code: '10-1001', Category_Name: 'Tithes', Fund_Code: '10', Payment_Type: 'Check' },
        { Contribution_ID: 'cnt_03', Month_Key: '2026-11', Gift_Date: '2026-11-08', Batch_ID: 'bat_1108_sun', Donor_Name: 'Wayne Crevoiserat', Amount: 300, Category_Code: '10-1001', Category_Name: 'Tithes', Fund_Code: '10', Payment_Type: 'Check' },
        { Contribution_ID: 'cnt_04', Month_Key: '2026-11', Gift_Date: '2026-11-08', Batch_ID: 'bat_1108_sun', Donor_Name: 'Dee (Huney) Huchton', Amount: 150, Category_Code: '70-1001', Category_Name: 'Celebrate Recovery Offerings', Fund_Code: '70', Payment_Type: 'Cash' },
        { Contribution_ID: 'cnt_05', Month_Key: '2026-11', Gift_Date: '2026-11-08', Batch_ID: 'bat_1108_sun', Donor_Name: 'Anonymous Loose Plate', Amount: 315, Category_Code: '10-1002', Category_Name: 'Offerings', Fund_Code: '10', Payment_Type: 'Cash' },
        { Contribution_ID: 'cnt_06', Month_Key: '2026-11', Gift_Date: '2026-11-08', Batch_ID: 'bat_1108_sun', Donor_Name: 'Sarah Gulick', Amount: 168, Category_Code: '10-2001', Category_Name: 'Building & Grounds', Fund_Code: '20', Payment_Type: 'Check' },
        { Contribution_ID: 'cnt_07', Month_Key: '2026-11', Gift_Date: '2026-11-15', Batch_ID: 'bat_1115_sun', Donor_Name: 'Joel Newman', Amount: 450, Category_Code: '10-1001', Category_Name: 'Tithes', Fund_Code: '10', Payment_Type: 'Check' },
        { Contribution_ID: 'cnt_08', Month_Key: '2026-11', Gift_Date: '2026-11-15', Batch_ID: 'bat_1115_sun', Donor_Name: 'Patricia Babb', Amount: 200, Category_Code: '10-1001', Category_Name: 'Tithes', Fund_Code: '10', Payment_Type: 'Check' },
        { Contribution_ID: 'cnt_09', Month_Key: '2026-11', Gift_Date: '2026-11-15', Batch_ID: 'bat_1115_sun', Donor_Name: 'Patricia Babb', Amount: 100, Category_Code: '70-1002', Category_Name: 'Food Pantry Offerings', Fund_Code: '70', Payment_Type: 'Check' },
        { Contribution_ID: 'cnt_10', Month_Key: '2026-11', Gift_Date: '2026-11-15', Batch_ID: 'bat_1115_sun', Donor_Name: 'Anonymous Loose Plate', Amount: 358, Category_Code: '10-1002', Category_Name: 'Offerings', Fund_Code: '10', Payment_Type: 'Cash' },
        { Contribution_ID: 'cnt_11', Month_Key: '2026-11', Gift_Date: '2026-11-20', Batch_ID: 'bat_1120_stripe', Donor_Name: 'Wayne Crevoiserat', Amount: 125, Category_Code: '10-1001', Category_Name: 'Tithes', Fund_Code: '10', Payment_Type: 'Card' }
      ],
      bankAccounts: [
        { Account_ID: 'bnk_boa_9284', Account_Name: 'Bank of America General Ops', Mask: '9284', Bucket: 'general', Opening_Balance: 2055.00 },
        { Account_ID: 'bnk_shield_4844', Account_Name: "SHIELD Children's Ministry", Mask: '4844', Bucket: 'other', Opening_Balance: 173.25 },
        { Account_ID: 'bnk_sca_3364', Account_Name: 'SHIELD Christian Academy', Mask: '3364', Bucket: 'other', Opening_Balance: 315.60 },
        { Account_ID: 'bnk_sca_4556', Account_Name: 'SCA Operating', Mask: '4556', Bucket: 'school', Opening_Balance: 17511.25 }
      ],
      funds: [
        { Fund_Code: '10', Fund_Name: 'General Fund', Restricted: 'No', Opening_Balance: 1480.00 },
        { Fund_Code: '20', Fund_Name: 'Building Fund - 20', Restricted: 'Yes', Opening_Balance: 850.00 },
        { Fund_Code: '30', Fund_Name: "SHIELD Children's Ministry 30", Restricted: 'Yes', Opening_Balance: 320.00 },
        { Fund_Code: '70', Fund_Name: 'Ministries 70 (CR & Compassionate)', Restricted: 'Yes', Opening_Balance: 410.00 },
        { Fund_Code: '80', Fund_Name: 'Shield Christian Academy 99', Restricted: 'Yes', Opening_Balance: 16995.10 }
      ],
      ledger: [
        { Line_ID: 'ln_03', Bank_Account_ID: 'bnk_boa_9284', Signed_Cash_Impact: 1065.00, Payee_Description: 'Sunday Nov 8 General Deposit', Fund_Code: '10' },
        { Line_ID: 'ln_05', Bank_Account_ID: 'bnk_boa_9284', Signed_Cash_Impact: 150.00, Payee_Description: 'Sunday Nov 8 CR Deposit', Fund_Code: '70' },
        { Line_ID: 'ln_06', Bank_Account_ID: 'bnk_boa_9284', Signed_Cash_Impact: 168.00, Payee_Description: 'Sunday Nov 8 Building Deposit', Fund_Code: '20' },
        { Line_ID: 'ln_07', Bank_Account_ID: 'bnk_boa_9284', Signed_Cash_Impact: 1008.00, Payee_Description: 'Sunday Nov 15 General Deposit', Fund_Code: '10' },
        { Line_ID: 'ln_09', Bank_Account_ID: 'bnk_boa_9284', Signed_Cash_Impact: 100.00, Payee_Description: 'Sunday Nov 15 Food Pantry Deposit', Fund_Code: '70' },
        { Line_ID: 'ln_10', Bank_Account_ID: 'bnk_boa_9284', Signed_Cash_Impact: -780.27, Payee_Description: 'Florida Power and Light (FPL)', Fund_Code: '10' },
        { Line_ID: 'ln_11', Bank_Account_ID: 'bnk_boa_9284', Signed_Cash_Impact: -600.00, Payee_Description: 'Pastor & Worship Payroll', Fund_Code: '10' },
        { Line_ID: 'ln_13', Bank_Account_ID: 'bnk_boa_9284', Signed_Cash_Impact: -48.95, Payee_Description: 'WM SUPERCENTER DELTONA', Fund_Code: '30', Needs_Receipt: 'Yes' }
      ],
      apBills: [
        { Bill_ID: 'ap_01', Vendor_Name: 'Spectrum Business Internet', Invoice_Number: 'INV-2026-1124', Due_Date: '2026-11-24', Amount: 159.98, Category_Code: '10-5202', Fund_Code: '10', Pay_From_Account_ID: 'bnk_boa_9284', Status: 'Approved' },
        { Bill_ID: 'ap_02', Vendor_Name: 'Waste Pro of Florida', Invoice_Number: 'WP-88412', Due_Date: '2026-11-25', Amount: 142.50, Category_Code: '10-5202', Fund_Code: '10', Pay_From_Account_ID: 'bnk_boa_9284', Status: 'Approved' },
        { Bill_ID: 'ap_03', Vendor_Name: 'Second Harvest Food Bank', Invoice_Number: 'SH-4902', Due_Date: '2026-11-25', Amount: 95.00, Category_Code: '70-5001', Fund_Code: '70', Pay_From_Account_ID: 'bnk_boa_9284', Status: 'Needs Review' },
        { Bill_ID: 'ap_04', Vendor_Name: 'SCA Bi-Weekly Faculty Payroll', Invoice_Number: 'PAY-1126', Due_Date: '2026-11-25', Amount: 4250.00, Category_Code: '80-5001', Fund_Code: '80', Pay_From_Account_ID: 'bnk_sca_4556', Status: 'Scheduled' }
      ],
      bankFeed: [
        { Feed_ID: 'fd_01', Bank_Account_ID: 'bnk_boa_9284', Posted_Date: '2026-11-20', Description: 'STRIPE DES:TRANSFER ID:ST-LFC1120', Direction: 'credit', Amount: 125.00, Suggested_Category: '10-1001', Suggested_Fund: '10', Review_Status: 'Pending' },
        { Feed_ID: 'fd_02', Bank_Account_ID: 'bnk_boa_9284', Posted_Date: '2026-11-20', Description: 'ST PAULY CLOTHING SHED LEASE', Direction: 'credit', Amount: 58.07, Suggested_Category: '10-2006', Suggested_Fund: '10', Review_Status: 'Pending' },
        { Feed_ID: 'fd_03', Bank_Account_ID: 'bnk_boa_9284', Posted_Date: '2026-11-21', Description: 'SPECTRUM BUSINESS AUTOPAY', Direction: 'debit', Amount: 159.98, Suggested_Category: '10-5202', Suggested_Fund: '10', Review_Status: 'Pending' }
      ],
      fridayChecklist: [
        { id: 1, label: 'Sync Plaid bank feeds across all 4 accounts', done: true },
        { id: 2, label: 'Verify Sunday Count Sheet matches locked batch', done: true },
        { id: 3, label: 'Match Stripe online giving payouts', done: false },
        { id: 4, label: 'Review AP Bills due in next 5 days', done: true },
        { id: 5, label: 'Follow up on Missing-Receipt debit card purchases', done: false }
      ]
    };
  }

  // ==========================================================================
  // SELF-CALCULATING ENGINE (Mirrors Google Sheets REPORT_* Formulas Live!)
  // ==========================================================================
  function computeSelfCalculatingMetrics(monthFilter) {
    const isApr = monthFilter === 'APR';
    const attRows = state.data.attendanceSessions.filter(r =>
      isApr ? true : String(r.Month_Key) === monthFilter
    );
    const avgByCat = cat => {
      const rows = attRows.filter(r => String(r.Ministry_Category) === cat);
      if (!rows.length) return 0;
      const sum = rows.reduce((acc, r) => acc + Number(r.Total_Attendance || 0), 0);
      return Math.round((sum / rows.length) * 10) / 10;
    };
    const adultRows = attRows.filter(r => String(r.Ministry_Category) === 'Sunday Worship - Adults');
    const kidRows = attRows.filter(r => String(r.Ministry_Category) === 'Sunday Worship - Children');
    const sundaysRecorded = adultRows.length;
    const combinedSum =
      adultRows.reduce((a, r) => a + Number(r.Total_Attendance || 0), 0) +
      kidRows.reduce((a, r) => a + Number(r.Total_Attendance || 0), 0);
    const avgCombinedWorship = sundaysRecorded > 0 ? Math.round((combinedSum / sundaysRecorded) * 10) / 10 : 0;

    // Visitors & APR Growth
    const visRows = state.data.visitors.filter(v => (isApr ? true : String(v.Month_Key) === monthFilter));
    const firstTimeVis = visRows.filter(v => String(v.Guest_Status) === '1st Time Visitor').length;
    const secondTimeVis = visRows.filter(v => String(v.Guest_Status) === '2nd Time Visitor').length;
    const followUpsDone = visRows.filter(v => String(v.Follow_Up_Status) === 'Completed').length;
    const followUpPct = visRows.length > 0 ? Math.round((followUpsDone / visRows.length) * 100) : 100;
    const professions = visRows.filter(v => String(v.Decision_Today) === 'Profession of Faith').length;

    // Giving & Average Weekly Giving
    const contribRows = state.data.contributions.filter(c =>
      (isApr ? true : String(c.Month_Key) === monthFilter) && String(c.Payment_Type) !== 'In-Kind'
    );
    const inKindRows = state.data.contributions.filter(c =>
      (isApr ? true : String(c.Month_Key) === monthFilter) && String(c.Payment_Type) === 'In-Kind'
    );
    const totalGiving = contribRows.reduce((a, c) => a + Number(c.Amount || 0), 0);
    const inKindTotal = inKindRows.reduce((a, c) => a + Number(c.Amount || 0), 0);
    const inPersonBatches = state.data.givingBatches.filter(b =>
      (isApr ? true : String(b.Month_Key) === monthFilter) && String(b.Batch_Type) === 'In-Person Giving'
    ).length;
    const weeksDivisor = inPersonBatches > 0 ? inPersonBatches : (totalGiving > 0 ? 4 : 1);
    const avgWeeklyGiving = totalGiving > 0 ? totalGiving / weeksDivisor : 0;
    const onlineGiving = contribRows
      .filter(c => ['Card', 'ACH'].indexOf(String(c.Payment_Type)) !== -1)
      .reduce((a, c) => a + Number(c.Amount || 0), 0);
    const onlinePct = totalGiving > 0 ? Math.round((onlineGiving / totalGiving) * 100) : 0;

    // Live Bank & True Fund Balances
    const bankSummary = state.data.bankAccounts.map(b => {
      const delta = state.data.ledger
        .filter(l => String(l.Bank_Account_ID) === String(b.Account_ID))
        .reduce((a, l) => a + Number(l.Signed_Cash_Impact || 0), 0);
      const unpaidBills = state.data.apBills
        .filter(ap => String(ap.Pay_From_Account_ID) === String(b.Account_ID) && String(ap.Status) !== 'Paid')
        .reduce((a, ap) => a + Number(ap.Amount || 0), 0);
      const liveBal = Number(b.Opening_Balance || 0) + delta;
      return {
        id: b.Account_ID,
        name: b.Account_Name,
        mask: b.Mask,
        liveBalance: liveBal,
        unpaidBills: unpaidBills,
        projected: liveBal - unpaidBills
      };
    });

    const fundSummary = state.data.funds.map(f => {
      const delta = state.data.ledger
        .filter(l => String(l.Fund_Code) === String(f.Fund_Code))
        .reduce((a, l) => a + Number(l.Signed_Cash_Impact || 0), 0);
      return {
        code: f.Fund_Code,
        name: f.Fund_Name,
        restricted: f.Restricted,
        liveBalance: Number(f.Opening_Balance || 0) + delta
      };
    });

    const totalBankCash = bankSummary.reduce((a, b) => a + b.liveBalance, 0);
    const totalFundBal = fundSummary.reduce((a, f) => a + f.liveBalance, 0);
    const totalUnpaidAp = bankSummary.reduce((a, b) => a + b.unpaidBills, 0);
    const drift = Math.round((totalBankCash - totalFundBal) * 100) / 100;

    const wef5Pct = Math.round(totalGiving * 0.05 * 100) / 100;
    const district8Pct = Math.round((totalGiving - wef5Pct) * 0.08 * 100) / 100;

    return {
      sundaysRecorded,
      avgAdults: avgByCat('Sunday Worship - Adults'),
      avgKids: avgByCat('Sunday Worship - Children'),
      avgCombinedWorship,
      avgSundaySchool: avgByCat('Sunday School'),
      avgCr: avgByCat('Celebrate Recovery'),
      avgShield: avgByCat('SHIELD Ministry'),
      firstTimeVis,
      secondTimeVis,
      followUpPct,
      professions,
      totalGiving,
      avgWeeklyGiving,
      onlineGiving,
      onlinePct,
      inKindTotal,
      wef5Pct,
      district8Pct,
      bankSummary,
      fundSummary,
      totalBankCash,
      totalFundBal,
      totalUnpaidAp,
      drift
    };
  }

  // ==========================================================================
  // HTTPS POST CLIENT TO GOOGLE APPS SCRIPT (CORS Preflight-Free)
  // ==========================================================================
  async function callVaultApi(action, payload) {
    if (!state.gasUrl) {
      return { ok: false, offlineDemo: true };
    }
    const bodyObj = Object.assign({ action: action, sessionToken: state.sessionToken }, payload || {});
    const resp = await fetch(state.gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(bodyObj)
    });
    return resp.json();
  }

  function showToast(msg) {
    const el = document.getElementById('toast-banner');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      el.hidden = true;
    }, 3200);
  }

  function fmtMoney(n) {
    return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function compressImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed reading file'));
      reader.onload = () => {
        if (!String(file.type || '').startsWith('image/')) {
          resolve({ base64: reader.result, name: file.name, mimeType: file.type || 'application/pdf' });
          return;
        }
        const img = new Image();
        img.onload = () => {
          const maxDim = 1300;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve({
            base64: canvas.toDataURL('image/jpeg', 0.82),
            name: file.name.replace(/\.\w+$/, '.jpg'),
            mimeType: 'image/jpeg'
          });
        };
        img.onerror = () => resolve({ base64: reader.result, name: file.name, mimeType: file.type });
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ==========================================================================
  // ROLE-ADAPTIVE MOBILE NAVIGATION DEFINITIONS
  // ==========================================================================
  function getNavTabsForCurrentSession() {
    if (state.mode === 'public') {
      return [
        { id: 'pub_connect', label: 'Connect', icon: ICONS.visitors },
        { id: 'pub_events', label: 'Events', icon: ICONS.calendar },
        { id: 'pub_prayer', label: 'Prayer', icon: ICONS.heart },
        { id: 'pub_give', label: 'Give', icon: ICONS.finance },
        { id: 'pub_worship', label: 'Worship', icon: ICONS.worship }
      ];
    }
    if (state.mode === 'worship_public') {
      return [
        { id: 'worship_stage', label: 'Stage Chords', icon: ICONS.worship },
        { id: 'pub_events', label: 'Service Order', icon: ICONS.calendar }
      ];
    }
    if (state.mode === 'rsvp') {
      return [{ id: 'rsvp_magic', label: 'RSVP Invite', icon: ICONS.calendar }];
    }

    const role = (state.user && state.user.role) || 'ministry_helper';
    if (role === 'super_admin') {
      return [
        { id: 'home', label: 'Home', icon: ICONS.home },
        { id: 'ministry', label: 'People/Att', icon: ICONS.attendance },
        { id: 'worship', label: 'Worship', icon: ICONS.worship },
        { id: 'finance', label: 'Finance', icon: ICONS.finance },
        { id: 'admin_users', label: 'Users/Pilot', icon: ICONS.users }
      ];
    }
    if (role === 'treasurer') {
      return [
        { id: 'home', label: 'Home', icon: ICONS.home },
        { id: 'finance', label: 'Accounting', icon: ICONS.finance },
        { id: 'counter', label: 'Giving', icon: ICONS.heart },
        { id: 'reports', label: 'Month-End', icon: ICONS.reports }
      ];
    }
    if (role === 'board_member') {
      return [
        { id: 'home', label: 'Board Pulse', icon: ICONS.reports },
        { id: 'schedules_my', label: 'Board Dates', icon: ICONS.calendar }
      ];
    }
    if (role === 'ministry_director') {
      return [
        { id: 'home', label: 'Today', icon: ICONS.home },
        { id: 'ministry', label: 'Kids/SHIELD', icon: ICONS.attendance },
        { id: 'schedules', label: 'Schedules', icon: ICONS.calendar },
        { id: 'reports', label: 'Reports', icon: ICONS.reports }
      ];
    }
    if (role === 'offering_counter') {
      return [
        { id: 'home', label: 'Today', icon: ICONS.home },
        { id: 'counter', label: 'Count Batch', icon: ICONS.finance }
      ];
    }
    if (role === 'worship_leader') {
      return [
        { id: 'home', label: 'Today', icon: ICONS.home },
        { id: 'worship', label: 'Outlines', icon: ICONS.worship },
        { id: 'worship_stage', label: 'Chords/Capo', icon: ICONS.calendar },
        { id: 'schedules', label: 'Helpers', icon: ICONS.attendance }
      ];
    }
    if (role === 'worship_team') {
      return [
        { id: 'schedules_my', label: 'My Dates', icon: ICONS.calendar },
        { id: 'worship_stage', label: 'Stage Chords', icon: ICONS.worship }
      ];
    }
    // ministry_helper (e.g. Sarah Gulick — Children's Helper Only)
    return [
      { id: 'home', label: 'Today', icon: ICONS.home },
      { id: 'ministry', label: 'Kids Check-In', icon: ICONS.attendance },
      { id: 'schedules_my', label: 'My Dates', icon: ICONS.calendar }
    ];
  }

  // ==========================================================================
  // SHELL & SCREEN RENDERING
  // ==========================================================================
  function enterShell() {
    document.getElementById('auth-screen').hidden = true;
    document.getElementById('app-shell').hidden = false;

    const badgeEl = document.getElementById('active-role-badge');
    const subEl = document.getElementById('active-user-subline');

    if (state.mode === 'public') {
      badgeEl.textContent = 'CONGREGATION';
      subEl.textContent = 'Public Connect, Events & Online Giving';
    } else if (state.mode === 'worship_public') {
      badgeEl.textContent = 'WORSHIP STAGE';
      subEl.textContent = 'Live ChordPro Transposer & Service Order';
    } else if (state.mode === 'rsvp') {
      badgeEl.textContent = 'HELPER RSVP';
      subEl.textContent = '1-Tap Ministry Schedule Confirmation';
    } else if (state.user) {
      const preset = CFG.rolePresets[state.user.role] || { badge: state.user.role };
      badgeEl.textContent = preset.badge + (state.isSimulated ? ' • PILOT' : '');
      const scopeTxt = Array.isArray(state.user.ministryScopes) ? state.user.ministryScopes.join(', ') : state.user.ministryScopes;
      subEl.textContent = state.user.fullName + (scopeTxt && scopeTxt !== '*' ? ' • ' + scopeTxt : '');
    }

    const pwModal = document.getElementById('force-pw-modal');
    const wsShell = document.getElementById('workspace-shell');
    if (state.user && state.user.mustChangePassword && !state.isSimulated) {
      pwModal.hidden = false;
      wsShell.hidden = true;
      return;
    }
    pwModal.hidden = true;
    wsShell.hidden = false;

    const tabs = getNavTabsForCurrentSession();
    if (!tabs.some(t => t.id === state.activeTab)) {
      state.activeTab = tabs[0].id;
    }
    renderNavBar(tabs);
    renderMainWorkspace();
  }

  function renderNavBar(tabs) {
    const nav = document.getElementById('role-bottom-nav');
    nav.innerHTML = tabs
      .map(
        t =>
          '<button type="button" id="nav-tab-' +
          t.id +
          '" class="nav-item-btn ' +
          (state.activeTab === t.id ? 'is-active' : '') +
          '" data-nav-id="' +
          t.id +
          '">' +
          t.icon +
          '<span>' +
          esc(t.label) +
          '</span></button>'
      )
      .join('');
  }

  function renderMainWorkspace() {
    const main = document.getElementById('workspace-main');
    const tab = state.activeTab;

    if (tab === 'home') {
      main.innerHTML = renderHomeTab();
    } else if (tab === 'reports') {
      main.innerHTML = renderReportsView();
    } else if (tab === 'ministry') {
      main.innerHTML = renderMinistryAttendanceTab();
    } else if (tab === 'visitor_entry') {
      main.innerHTML = renderVisitorCardEntry();
    } else if (tab === 'worship') {
      main.innerHTML = renderWorshipPlannerTab();
    } else if (tab === 'worship_stage') {
      main.innerHTML = renderWorshipStageView();
    } else if (tab === 'schedules' || tab === 'schedules_my') {
      main.innerHTML = renderSchedulesTab(tab === 'schedules_my');
    } else if (tab === 'counter') {
      main.innerHTML = renderOfferingCounterTab();
    } else if (tab === 'finance') {
      main.innerHTML = renderFinanceTab();
    } else if (tab === 'admin_users') {
      main.innerHTML = renderSuperAdminUsersTab();
    } else if (tab.startsWith('pub_')) {
      main.innerHTML = renderPublicPortalTab(tab);
    } else if (tab === 'rsvp_magic') {
      main.innerHTML = renderRsvpMagicTab();
    }
  }

  // ==========================================================================
  // VIEW 1: SMART ROLE-ADAPTIVE HOME + SELF-CALCULATING SCORECARD
  // ==========================================================================
  function renderHomeTab() {
    const role = (state.user && state.user.role) || 'ministry_helper';
    const m = computeSelfCalculatingMetrics(state.reportMonth);

    let heroTitle = "Today's Quick Ministry Action";
    let heroDesc = '1-tap mobile workflow tailored for your ministry role.';
    let heroBtnLabel = 'Open Attendance';
    let heroTargetTab = 'ministry';

    if (role === 'super_admin') {
      heroTitle = 'Super Admin & Pilot Command (' + esc(state.user.fullName) + ')';
      heroDesc = '172 real ChurchTrac people, 93 households & 523 contributions migrated into Vault • Tap below to share phone pilot links or review feedback.';
      heroBtnLabel = 'Share Phone Pilot Links & Provision Users';
      heroTargetTab = 'admin_users';
    } else if (role === 'treasurer') {
      heroTitle = 'Treasurer Hub — Dee "Huney" Huchton';
      heroDesc = 'AP bills due: ' + fmtMoney(m.totalUnpaidAp) + ' • WEF (5%): ' + fmtMoney(m.wef5Pct) + ' • District (8%): ' + fmtMoney(m.district8Pct) + ' • Drift: $0.00.';
      heroBtnLabel = 'Open Accounting, Transfers & Friday Cash';
      heroTargetTab = 'finance';
    } else if (role === 'board_member') {
      heroTitle = 'Church Board Executive Summary';
      heroDesc = 'Review live Month-End & Nazarene APR Attendance, Visitor Growth, Aggregate Stewardship, and Fund Health (donor PII kept confidential).';
      heroBtnLabel = 'View Upcoming Board Dates';
      heroTargetTab = 'schedules_my';
    } else if (role === 'ministry_director') {
      heroTitle = "Children's, SHIELD & SCA Hub — April Newman";
      heroDesc = 'Manage Kids Security Check-In, SHIELD Ministry & SCA Attendance, Visitor Cards & Follow-Up, Helper Schedules, and Month-End Attendance Reports.';
      heroBtnLabel = 'Open Kids, SHIELD & Visitor Check-In';
      heroTargetTab = 'ministry';
    } else if (role === 'offering_counter') {
      heroTitle = 'Sunday Offering Count Ready';
      heroDesc = 'Enter cash/check envelopes, snap a photo of the signed Count Sheet, and lock batch when balanced.';
      heroBtnLabel = 'Start Counting Batch';
      heroTargetTab = 'counter';
    } else if (role === 'worship_leader') {
      heroTitle = 'Worship Area Head — Wayne Crev';
      heroDesc = '8 Advent outline items ready • Guitar Capo calculator & 12-key stage charts active.';
      heroBtnLabel = 'Edit Service Outline & Team';
      heroTargetTab = 'worship';
    } else if (role === 'ministry_helper') {
      const scopes = (state.user.ministryScopes || []).join(', ');
      heroTitle = "Children's Helper Check-In (" + esc(scopes || 'Children') + ')';
      heroDesc = 'Check children in with automatic 4-digit parent pickup security badges.';
      heroBtnLabel = 'Open Kids Check-In Roster';
      heroTargetTab = 'ministry';
    }

    let html = '<div class="section-stack">';
    html +=
      '<section class="card card--action-hero">' +
      '<span class="eyebrow-tag">SMART MOBILE ACTION &bull; TAP 💬 BELOW TO SUGGEST CHANGES</span>' +
      '<h1 class="card-title" style="font-size: 1.2rem; margin-top: 8px;">' + esc(heroTitle) + '</h1>' +
      '<p class="card-subtitle" style="margin-bottom: 14px;">' + esc(heroDesc) + '</p>' +
      '<button type="button" id="hero-primary-cta" class="btn btn--gold btn--full" data-jump-tab="' + heroTargetTab + '">' +
      esc(heroBtnLabel) + ' &rarr;</button>' +
      '</section>';

    if (role === 'super_admin' || role === 'treasurer' || role === 'board_member' || role === 'ministry_director') {
      html += renderReportsView();
    } else {
      html +=
        '<section class="card">' +
        '<div class="card-head"><div><h2 class="card-title">Upcoming Ministry Dates</h2><p class="card-subtitle">Your assigned area events</p></div></div>' +
        '<div class="list-stack">' +
        state.data.events
          .slice(0, 3)
          .map(
            ev =>
              '<div class="list-row"><div class="list-row__main"><div class="list-row__title">' +
              esc(ev.Title) +
              '</div><div class="list-row__meta">' +
              esc(ev.Event_Date) +
              ' &bull; ' +
              esc(ev.Start_Time) +
              ' &bull; ' +
              esc(ev.Location) +
              '</div></div><span class="badge badge--gold">' +
              esc(ev.Ministry_Scope) +
              '</span></div>'
          )
          .join('') +
        '</div></section>';
    }

    html += '</div>';
    return html;
  }

  function renderReportsView() {
    const m = computeSelfCalculatingMetrics(state.reportMonth);
    const links = state.data.vaultLinks || {};
    const role = (state.user && state.user.role) || '';
    const isSuper = role === 'super_admin';
    const isTreas = role === 'treasurer';
    const isMinDir = role === 'ministry_director';

    if (isMinDir) {
      return (
        '<section class="card">' +
        '<div class="card-head">' +
        '<div>' +
        '<h2 class="card-title">Children\'s, SHIELD &amp; Visitor Month-End / APR Rollups</h2>' +
        '<p class="card-subtitle">Self-calculated Attendance &amp; Visitor Growth from Google Drive Vault (no church banking)</p>' +
        '</div>' +
        '<select id="report-month-select" class="select" style="width: auto; min-height: 38px; font-size: 13px;">' +
        '<option value="2026-11" ' + (state.reportMonth === '2026-11' ? 'selected' : '') + '>November 2026</option>' +
        '<option value="2026-10" ' + (state.reportMonth === '2026-10' ? 'selected' : '') + '>October 2026</option>' +
        '<option value="APR" ' + (state.reportMonth === 'APR' ? 'selected' : '') + '>2026-2027 Nazarene APR</option>' +
        '</select>' +
        '</div>' +
        '<div class="kpi-grid">' +
        '<div class="kpi-tile"><span class="kpi-tile__label">Avg Sunday Worship</span><div class="kpi-tile__val kpi-tile__val--gold">' + m.avgCombinedWorship + '</div><span class="kpi-tile__meta">' + m.avgAdults + ' Adults + ' + m.avgKids + ' Kids (' + m.sundaysRecorded + ' Sun)</span></div>' +
        '<div class="kpi-tile"><span class="kpi-tile__label">Children\'s Worship Avg</span><div class="kpi-tile__val kpi-tile__val--emerald">' + m.avgKids + '</div><span class="kpi-tile__meta">Sunday Nursery &amp; Kids</span></div>' +
        '<div class="kpi-tile"><span class="kpi-tile__label">SHIELD &amp; Sunday School</span><div class="kpi-tile__val">SHIELD ' + m.avgShield + '</div><span class="kpi-tile__meta">Sunday School Avg: ' + m.avgSundaySchool + '</span></div>' +
        '<div class="kpi-tile"><span class="kpi-tile__label">New 1st-Time Visitors</span><div class="kpi-tile__val">' + m.firstTimeVis + '</div><span class="kpi-tile__meta">' + m.secondTimeVis + ' Return &bull; ' + m.followUpPct + '% F-Up Done</span></div>' +
        '</div>' +
        '<div style="margin-top: 12px;" class="kpi-grid">' +
        '<div class="kpi-tile"><span class="kpi-tile__label">Spiritual Decisions</span><div class="kpi-tile__val kpi-tile__val--gold">' + m.professions + '</div><span class="kpi-tile__meta">APR Evangelism Rollup</span></div>' +
        '<div class="kpi-tile"><span class="kpi-tile__label">48-Hr Visitor Care</span><div class="kpi-tile__val kpi-tile__val--emerald">' + m.followUpPct + '%</div><span class="kpi-tile__meta">Follow-Ups Completed</span></div>' +
        '</div>' +
        '</section>'
      );
    }

    return (
      '<section class="card">' +
      '<div class="card-head">' +
      '<div>' +
      '<h2 class="card-title">Self-Calculating Month-End &amp; Nazarene APR Rollups</h2>' +
      '<p class="card-subtitle">Auto-calculated in your Google Drive Vault (incl. WEF 5% &amp; District 8%)</p>' +
      '</div>' +
      '<select id="report-month-select" class="select" style="width: auto; min-height: 38px; font-size: 13px;">' +
      '<option value="2026-11" ' + (state.reportMonth === '2026-11' ? 'selected' : '') + '>November 2026</option>' +
      '<option value="2026-10" ' + (state.reportMonth === '2026-10' ? 'selected' : '') + '>October 2026</option>' +
      '<option value="APR" ' + (state.reportMonth === 'APR' ? 'selected' : '') + '>2026-2027 Nazarene APR</option>' +
      '</select>' +
      '</div>' +
      '<div class="kpi-grid">' +
      '<div class="kpi-tile"><span class="kpi-tile__label">Avg Sunday Worship</span><div class="kpi-tile__val kpi-tile__val--gold">' + m.avgCombinedWorship + '</div><span class="kpi-tile__meta">' + m.avgAdults + ' Adults + ' + m.avgKids + ' Kids (' + m.sundaysRecorded + ' Sun)</span></div>' +
      '<div class="kpi-tile"><span class="kpi-tile__label">New 1st-Time Visitors</span><div class="kpi-tile__val">' + m.firstTimeVis + '</div><span class="kpi-tile__meta">' + m.secondTimeVis + ' Return &bull; ' + m.followUpPct + '% F-Up Done</span></div>' +
      '<div class="kpi-tile"><span class="kpi-tile__label">Avg Weekly Giving</span><div class="kpi-tile__val kpi-tile__val--emerald">' + fmtMoney(m.avgWeeklyGiving) + '</div><span class="kpi-tile__meta">Total: ' + fmtMoney(m.totalGiving) + '</span></div>' +
      '<div class="kpi-tile"><span class="kpi-tile__label">WEF (5%) &amp; District (8%)</span><div class="kpi-tile__val">' + fmtMoney(m.wef5Pct) + '</div><span class="kpi-tile__meta">District 8%: ' + fmtMoney(m.district8Pct) + '</span></div>' +
      '</div>' +
      '<div style="margin-top: 12px;" class="kpi-grid">' +
      '<div class="kpi-tile"><span class="kpi-tile__label">Total Bank Cash (4 Accts)</span><div class="kpi-tile__val">' + fmtMoney(m.totalBankCash) + '</div><span class="kpi-tile__meta">After Bills: ' + fmtMoney(m.totalBankCash - m.totalUnpaidAp) + '</span></div>' +
      '<div class="kpi-tile"><span class="kpi-tile__label">True Fund Balance (5 Funds)</span><div class="kpi-tile__val kpi-tile__val--emerald">' + fmtMoney(m.totalFundBal) + '</div><span class="kpi-tile__meta">' + (m.drift === 0 ? 'BALANCED ($0.00 Drift)' : 'Drift: ' + fmtMoney(m.drift)) + '</span></div>' +
      '<div class="kpi-tile"><span class="kpi-tile__label">Midweek Averages</span><div class="kpi-tile__val">CR ' + m.avgCr + '</div><span class="kpi-tile__meta">SHIELD ' + m.avgShield + ' &bull; SS ' + m.avgSundaySchool + '</span></div>' +
      '<div class="kpi-tile"><span class="kpi-tile__label">Professions &amp; In-Kind</span><div class="kpi-tile__val kpi-tile__val--gold">' + m.professions + ' Decisions</div><span class="kpi-tile__meta">In-Kind: ' + fmtMoney(m.inKindTotal) + '</span></div>' +
      '</div>' +
      ((isSuper || isTreas)
        ? '<div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-subtle);">' +
          '<span class="field-label" style="display:block; margin-bottom:8px;">Open Behind-the-Scenes Google Drive Vault</span>' +
          '<div style="display:flex; flex-wrap:wrap; gap:8px;">' +
          '<a class="btn btn--secondary btn--sm" href="' + esc(links.vaultFolder || CFG.vault.folderUrl) + '" target="_blank" rel="noopener">Master Vault Folder &nearr;</a>' +
          (isSuper ? '<a class="btn btn--secondary btn--sm" href="' + esc(CFG.vault.workbooks.people.url) + '" target="_blank" rel="noopener">02 People (172 Real Records) &nearr;</a>' : '') +
          (isSuper ? '<a class="btn btn--secondary btn--sm" href="' + esc(CFG.vault.workbooks.worship.url) + '" target="_blank" rel="noopener">03 Worship Sheet &nearr;</a>' : '') +
          '<a class="btn btn--secondary btn--sm" href="' + esc(CFG.vault.workbooks.finance.url) + '" target="_blank" rel="noopener">04 Giving &amp; Accounting (523 Gifts) &nearr;</a>' +
          '</div></div>'
        : '') +
      '</section>'
    );
  }

  // ==========================================================================
  // VIEW 2: DIRECTORY, 1-TAP MOBILE ATTENDANCE, KIDS CHECK-IN & VISITORS
  // ==========================================================================
  function renderMinistryAttendanceTab() {
    const isSuper = state.user && state.user.role === 'super_admin';
    const isKidsOnly = state.user && state.user.role === 'ministry_helper' && (state.user.ministryScopes || []).indexOf('Children') !== -1;
    const defaultSub = isKidsOnly ? 'roster' : 'headcount';
    const curSub = state.subTab || defaultSub;

    let html = '<div class="section-stack">';
    html +=
      '<div class="sub-tabs">' +
      (!isKidsOnly ? '<button type="button" class="sub-tab-btn ' + (curSub === 'headcount' ? 'is-active' : '') + '" data-subtab="headcount">Sunday Headcount</button>' : '') +
      '<button type="button" class="sub-tab-btn ' + (curSub === 'roster' ? 'is-active' : '') + '" data-subtab="roster">' + (isKidsOnly ? "Children's Check-In" : 'Kids &amp; Ministry Check-In') + '</button>' +
      (isSuper ? '<button type="button" class="sub-tab-btn ' + (curSub === 'directory' ? 'is-active' : '') + '" data-subtab="directory">People Directory (172)</button>' : '') +
      (!isKidsOnly ? '<button type="button" class="sub-tab-btn ' + (curSub === 'visitors_list' ? 'is-active' : '') + '" data-subtab="visitors_list">Visitor Cards &amp; Follow-Up</button>' : '') +
      '</div>';

    if (curSub === 'directory' && isSuper) {
      const q = state.dirQuery.toLowerCase();
      const filtered = state.data.people.filter(p => {
        const matchQ = !q || (p.First_Name + ' ' + p.Last_Name + ' ' + (p.Email || '') + ' ' + (p.Mobile_Phone || '')).toLowerCase().indexOf(q) !== -1;
        const matchSt = state.dirStatusFilter === 'All' || p.Member_Status === state.dirStatusFilter;
        return matchQ && matchSt;
      });
      html +=
        '<section class="card">' +
        '<div class="card-head"><div><h1 class="card-title">LFC Directory &amp; Households</h1><p class="card-subtitle">Synced with 172 migrated ChurchTrac records in <code>02_LFC_People_Events_&amp;_Attendance</code></p></div></div>' +
        '<div class="form-grid-2" style="margin-bottom:12px;">' +
        '<input id="dir-search-input" class="input" placeholder="Search name, phone, or email..." value="' + esc(state.dirQuery) + '" />' +
        '<select id="dir-status-select" class="select">' +
        ['All', 'Voting Member', 'Affiliated', 'Child', 'Visitor', 'AWOL (Needs F-UP)'].map(s => '<option value="' + esc(s) + '" ' + (state.dirStatusFilter === s ? 'selected' : '') + '>' + esc(s) + '</option>').join('') +
        '</select></div>' +
        '<div class="list-stack" style="margin-bottom:14px;">' +
        filtered.slice(0, 40).map(p =>
          '<div class="list-row"><div class="list-row__main"><div class="list-row__title">' + esc(p.First_Name + ' ' + p.Last_Name) + ' <span class="badge badge--gold">' + esc(p.Member_Status) + '</span></div>' +
          '<div class="list-row__meta">' + esc(p.Role_Note || p.Ministry_Summary || p.Age_Category || '') + (p.Mobile_Phone ? ' &bull; ' + esc(p.Mobile_Phone) : '') + (p.Email ? ' &bull; ' + esc(p.Email) : '') + '</div></div>' +
          (p.Mobile_Phone ? '<a class="btn btn--secondary btn--sm" href="tel:' + esc(p.Mobile_Phone) + '">📞 Call</a>' : '') +
          '</div>'
        ).join('') +
        '</div>' +
        '<form id="add-person-form" style="border-top:1px solid var(--border-subtle); padding-top:12px;">' +
        '<span class="field-label" style="display:block; margin-bottom:8px;">+ Add Person to Church Directory (Defaults Safely to Visitor)</span>' +
        '<div class="form-grid-2">' +
        '<div class="field"><input id="np-first" class="input" placeholder="First Name" required /></div>' +
        '<div class="field"><input id="np-last" class="input" placeholder="Last Name" required /></div>' +
        '</div>' +
        '<div class="form-grid-2">' +
        '<div class="field"><select id="np-status" class="select"><option>Visitor</option><option>Affiliated</option><option>Child</option><option>Voting Member</option></select></div>' +
        '<div class="field"><input id="np-phone" class="input" placeholder="Mobile Phone" /></div>' +
        '</div>' +
        '<button type="submit" class="btn btn--gold btn--full">+ Save Person to Vault Directory</button></form></section>';
      html += '</div>';
      return html;
    }

    if (curSub === 'headcount') {
      const combined = state.attHeadcountAdults + state.attHeadcountKids;
      html +=
        '<section class="card">' +
        '<h1 class="card-title">1-Tap Sunday Worship Headcount</h1>' +
        '<p class="card-subtitle" style="margin-bottom:14px;">Saves directly to <code>Attendance_Sessions</code> and updates Month-End Worship Averages automatically.</p>' +
        '<div class="list-stack">' +
        '<div class="stepper-box"><div><div class="list-row__title">Sanctuary Adults</div><div class="list-row__meta">10:30 AM Worship Center</div></div>' +
        '<div class="stepper-controls"><button type="button" class="stepper-btn" data-step="adults:-1">&minus;</button><span class="stepper-val">' + state.attHeadcountAdults + '</span><button type="button" class="stepper-btn" data-step="adults:1">+</button></div></div>' +
        '<div class="stepper-box"><div><div class="list-row__title">Children &amp; Dismissed Kids</div><div class="list-row__meta">Nursery + Kids Worship</div></div>' +
        '<div class="stepper-controls"><button type="button" class="stepper-btn" data-step="kids:-1">&minus;</button><span class="stepper-val">' + state.attHeadcountKids + '</span><button type="button" class="stepper-btn" data-step="kids:1">+</button></div></div>' +
        '<div class="stepper-box"><div><div class="list-row__title">1st-Time Guests Today</div><div class="list-row__meta">Counted in APR Evangelism</div></div>' +
        '<div class="stepper-controls"><button type="button" class="stepper-btn" data-step="guests:-1">&minus;</button><span class="stepper-val">' + state.attFirstTimers + '</span><button type="button" class="stepper-btn" data-step="guests:1">+</button></div></div>' +
        '</div>' +
        '<div style="margin:14px 0; padding:12px; border-radius:10px; background:var(--gold-tint); display:flex; justify-content:space-between; align-items:center;">' +
        '<span style="font-weight:700;">Combined Worship Total</span><strong style="font-size:1.3rem; color:var(--gold);">' + combined + '</strong></div>' +
        '<button type="button" id="save-sunday-headcount-btn" class="btn btn--gold btn--full">Record Sunday Headcount to Drive Vault</button>' +
        '</section>';
    } else if (curSub === 'roster') {
      const checkedCount = Object.values(state.attRosterChecked).filter(Boolean).length;
      const isMinDir = state.user && state.user.role === 'ministry_director';
      const rosterPool = isKidsOnly
        ? state.data.people.filter(p => p.Member_Status === 'Child')
        : state.data.people;
      html +=
        '<section class="card">' +
        '<div class="card-head"><div><h1 class="card-title">' + (isKidsOnly ? "Children's Security Check-In &amp; Attendance" : isMinDir ? "Children's, SHIELD &amp; SCA Check-In" : 'Group Roster &amp; Child Security Check-In') + '</h1><p class="card-subtitle">Tap names to mark Present; Children receive a 4-digit parent pickup code</p></div>' +
        '<select id="roster-group-select" class="select" style="width:auto; min-height:38px;">' +
        (isKidsOnly
          ? '<option value="Sunday Worship - Children">Children\'s Worship &amp; Nursery (10:30 AM)</option>' +
            '<option value="LFC Kids Club">LFC Kids Club (Wed 6:00 PM)</option>'
          : isMinDir
          ? '<option value="Sunday Worship - Children">Children\'s Worship &amp; Nursery (10:30 AM)</option>' +
            '<option value="SHIELD Ministry">SHIELD Kids &amp; Youth (Wed 6:00 PM)</option>' +
            '<option value="SHIELD Christian Academy">SHIELD Christian Academy (SCA)</option>' +
            '<option value="LFC Kids Club">LFC Kids Club (Wed 6:00 PM)</option>' +
            '<option value="Sunday School">Sunday School (9:30 AM)</option>'
          : '<option value="Sunday Worship - Children">Children\'s Worship &amp; Nursery (10:30 AM)</option>' +
            '<option value="Sunday School">Sunday School (9:30 AM)</option>' +
            '<option value="Celebrate Recovery">Celebrate Recovery (Wed 7:00 PM)</option>' +
            '<option value="SHIELD Ministry">SHIELD Kids &amp; Youth (Wed 6:00 PM)</option>') +
        '</select></div>' +
        '<div class="list-stack" style="margin-bottom:12px;">' +
        rosterPool
          .map(p => {
            const present = Boolean(state.attRosterChecked[p.Person_ID]);
            const badge = p.Member_Status === 'Child' && present ? '<span class="badge badge--gold">Pickup Badge #K8F4</span>' : '';
            return (
              '<button type="button" class="roster-check-btn ' + (present ? 'is-present' : '') + '" data-toggle-person="' + esc(p.Person_ID) + '">' +
              '<div><div class="list-row__title">' + esc(p.First_Name + ' ' + p.Last_Name) + '</div><div class="list-row__meta">' + esc(p.Role_Note || p.Member_Status) + '</div></div>' +
              '<div style="display:flex; align-items:center; gap:8px;">' + badge + '<span class="badge ' + (present ? 'badge--emerald' : 'badge--sky') + '">' + (present ? 'Present ✓' : 'Tap Check-In') + '</span></div>' +
              '</button>'
            );
          })
          .join('') +
        '</div>' +
        '<div class="stepper-box" style="margin-bottom:12px;"><div><div class="list-row__title">' + (isKidsOnly ? 'Visiting Children Today' : 'Unnamed Walk-In Guests') + '</div><div class="list-row__meta">Added to named roster (' + checkedCount + ' checked in)</div></div>' +
        '<div class="stepper-controls"><button type="button" class="stepper-btn" data-step="unnamed:-1">&minus;</button><span class="stepper-val">' + state.attUnnamedGuests + '</span><button type="button" class="stepper-btn" data-step="unnamed:1">+</button></div></div>' +
        '<button type="button" id="save-roster-session-btn" class="btn btn--gold btn--full">Save Roster Attendance (' + (checkedCount + state.attUnnamedGuests) + ' Total)</button>' +
        '</section>';
    } else {
      html += renderVisitorCardEntry();
      html +=
        '<section class="card">' +
        '<h2 class="card-title" style="margin-bottom:10px;">Recent Visitor Cards &amp; 48-Hr Follow-Up Queue</h2>' +
        '<div class="list-stack">' +
        state.data.visitors
          .slice()
          .reverse()
          .map(
            v =>
              '<div class="list-row"><div class="list-row__main"><div class="list-row__title">' +
              esc(v.Full_Name) +
              ' <span class="badge badge--gold">' + esc(v.Guest_Status) + '</span></div>' +
              '<div class="list-row__meta">' + esc(v.Visit_Date) + ' &bull; ' + esc(v.Ministry_Source) + (v.Prayer_Request ? ' &bull; Prayer: ' + esc(v.Prayer_Request) : '') + '</div></div>' +
              (v.Follow_Up_Status === 'Completed'
                ? '<span class="badge badge--emerald">Followed Up ✓</span>'
                : '<button type="button" class="btn btn--emerald btn--sm" data-complete-fup="' + esc(v.Submission_ID) + '">Mark F-Up Done</button>') +
              '</div>'
          )
          .join('') +
        '</div></section>';
    }

    html += '</div>';
    return html;
  }

  function renderVisitorCardEntry() {
    return (
      '<section class="card">' +
      '<h1 class="card-title">Enter Visitor Card + Snap Card Photo</h1>' +
      '<p class="card-subtitle" style="margin-bottom:12px;">Auto-files card photo in <code>13_Visitor_&_Connect_Card_Scans</code> and increments Monthly New Visitors.</p>' +
      '<form id="visitor-card-form">' +
      '<div class="form-grid-2">' +
      '<div class="field"><label class="field-label" for="vis-name">Guest / Family Name</label><input id="vis-name" class="input" placeholder="e.g. Jordan &amp; Taylor Smith" required /></div>' +
      '<div class="field"><label class="field-label" for="vis-phone">Mobile Phone</label><input id="vis-phone" type="tel" class="input" placeholder="(386) 555-0199" /></div>' +
      '</div>' +
      '<div class="form-grid-2">' +
      '<div class="field"><label class="field-label" for="vis-status">Visit Type</label><select id="vis-status" class="select"><option>1st Time Visitor</option><option>2nd Time Visitor</option><option>Regular / Prayer Request</option></select></div>' +
      '<div class="field"><label class="field-label" for="vis-decision">Spiritual Decision / APR</label><select id="vis-decision" class="select"><option>None</option><option>Profession of Faith</option><option>Baptism Interest</option><option>Membership Interest</option><option>Speak with Pastor</option></select></div>' +
      '</div>' +
      '<div class="field"><label class="field-label" for="vis-prayer">Prayer Request or Notes</label><textarea id="vis-prayer" class="textarea" placeholder="How can Pastor Joel and the team pray for them?"></textarea></div>' +
      '<div class="field"><label class="camera-upload-label"><input type="file" id="vis-photo-input" accept="image/*" capture="environment" /><span>' +
      (state.pendingPhotoName ? 'Attached: ' + esc(state.pendingPhotoName) : '📷 Tap to Snap Paper Visitor Card Photo') +
      '</span></label></div>' +
      '<button type="submit" id="submit-visitor-btn" class="btn btn--gold btn--full">Save Visitor Card to Google Drive Vault</button>' +
      '</form></section>'
    );
  }

  // ==========================================================================
  // VIEW 3: WORSHIP PLANNER & 12-KEY STAGE CHORDPRO TRANSPOSER
  // ==========================================================================
  function renderWorshipPlannerTab() {
    return (
      '<div class="section-stack">' +
      '<section class="card">' +
      '<div class="card-head"><div><h1 class="card-title">Sunday AM Service Order</h1><p class="card-subtitle">Stepping Into the Waters (Joshua 3:1-17) &bull; Tap any song to open live ChordPro chart</p></div>' +
      '<button type="button" class="btn btn--secondary btn--sm" data-jump-tab="worship_stage">Open Stage Chords &rarr;</button></div>' +
      '<div class="list-stack">' +
      state.data.outlines
        .map(item => {
          const mins = Math.floor(Number(item.Duration_Sec || 0) / 60);
          const secs = String(Number(item.Duration_Sec || 0) % 60).padStart(2, '0');
          const isSong = item.Item_Type === 'song';
          return (
            '<div class="list-row">' +
            '<div class="list-row__main">' +
            '<div class="list-row__title">' + esc(item.Sort_Order + '. ' + item.Title) + (item.Selected_Key ? ' <span class="badge badge--gold">Key of ' + esc(item.Selected_Key) + '</span>' : '') + '</div>' +
            '<div class="list-row__meta">' + esc(item.Led_By) + ' &bull; ' + mins + ':' + secs + '</div>' +
            '</div>' +
            (isSong
              ? '<button type="button" class="btn btn--secondary btn--sm" data-open-song="' + esc(item.Song_ID) + '" data-open-key="' + esc(item.Selected_Key || 'G') + '">Transpose / View</button>'
              : '<span class="badge badge--sky">Element</span>') +
            '</div>'
          );
        })
        .join('') +
      '</div></section>' +
      '<section class="card">' +
      '<h2 class="card-title" style="margin-bottom:10px;">Add Song to Vault Song Library</h2>' +
      '<form id="add-song-form">' +
      '<div class="form-grid-2">' +
      '<div class="field"><label class="field-label" for="song-title">Song Title</label><input id="song-title" class="input" placeholder="e.g. Goodness of God" required /></div>' +
      '<div class="field"><label class="field-label" for="song-key">Default Key</label><select id="song-key" class="select">' +
      window.LFCChordPro.DISPLAY_KEYS.map(k => '<option value="' + k + '">' + k + '</option>').join('') +
      '</select></div></div>' +
      '<div class="field"><label class="field-label" for="song-chordpro">ChordPro Lyrics &amp; Chords</label><textarea id="song-chordpro" class="textarea" placeholder="{c: Chorus}\nAll my [G]life You have been [C]faithful..."></textarea></div>' +
      '<button type="submit" class="btn btn--gold btn--full">Save Song to 03_LFC_Worship Sheet</button>' +
      '</form></section></div>'
    );
  }

  function renderWorshipStageView() {
    const songs = state.data.songs;
    const song = songs.find(s => s.Song_ID === state.selectedSongId) || songs[0];
    const targetKey = state.selectedKey || song.Default_Key || 'G';
    const renderedChart = window.LFCChordPro.renderChartHtml(
      song.ChordPro_Chart,
      song.Default_Key || 'G',
      targetKey,
      state.showChords
    );

    return (
      '<div class="section-stack">' +
      '<section class="card">' +
      '<div class="card-head">' +
      '<div><h1 class="card-title">Musician Stage ChordPro View</h1><p class="card-subtitle">Instant 12-key transposition for phone, iPad &amp; music stand</p></div>' +
      '</div>' +
      '<div class="form-grid-2" style="margin-bottom:10px;">' +
      '<div class="field" style="margin-bottom:0;"><label class="field-label" for="stage-song-select">Select Song</label><select id="stage-song-select" class="select">' +
      songs.map(s => '<option value="' + esc(s.Song_ID) + '" ' + (s.Song_ID === song.Song_ID ? 'selected' : '') + '>' + esc(s.Title) + ' (Orig: ' + esc(s.Default_Key) + ')</option>').join('') +
      '</select></div>' +
      '<div class="field" style="margin-bottom:0;"><label class="field-label" for="stage-key-select">Transpose Key</label><select id="stage-key-select" class="select">' +
      window.LFCChordPro.DISPLAY_KEYS.map(k => '<option value="' + k + '" ' + (k === targetKey ? 'selected' : '') + '>Key of ' + k + '</option>').join('') +
      '</select></div>' +
      '</div>' +
      '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;">' +
      '<button type="button" id="toggle-chords-btn" class="btn btn--secondary btn--sm">' + (state.showChords ? 'Hide Chords (Lyrics Only)' : 'Show Chords') + '</button>' +
      '<button type="button" id="font-smaller-btn" class="btn btn--secondary btn--sm">A&minus;</button>' +
      '<button type="button" id="font-larger-btn" class="btn btn--secondary btn--sm">A+</button>' +
      '<span class="badge badge--gold" style="margin-left:auto;">' + esc(song.BPM || 74) + ' BPM &bull; CCLI #' + esc(song.CCLI_Number || '—') + '</span>' +
      '</div>' +
      (window.LFCChordPro.getCapoSuggestions(targetKey).length
        ? '<div style="margin-bottom:12px; display:flex; gap:6px; flex-wrap:wrap; align-items:center;"><span class="field-label">🎸 Guitar Capo Options:</span>' +
          window.LFCChordPro.getCapoSuggestions(targetKey).slice(0, 3).map(c => '<span class="badge badge--emerald">' + esc(c.label) + '</span>').join('') +
          '</div>'
        : '') +
      '<div class="chord-stage-surface" style="font-size:' + state.chordFontSize + 'px;">' +
      renderedChart +
      '</div></section></div>'
    );
  }

  function renderSchedulesTab(onlyMine) {
    const uname = state.user && state.user.username;
    const rows = onlyMine && uname
      ? state.data.schedules.filter(s => s.Helper_Username === uname)
      : state.data.schedules;
    return (
      '<div class="section-stack"><section class="card">' +
      '<h1 class="card-title">' + (onlyMine ? 'My Upcoming Dates &amp; 1-Tap RSVP' : 'Ministry &amp; Board Schedules + SMS Invites') + '</h1>' +
      '<p class="card-subtitle" style="margin-bottom:12px;">Helpers &amp; Board members receive a 1-tap Twilio SMS magic link to confirm without logging in.</p>' +
      '<div class="list-stack">' +
      rows
        .map(
          s =>
            '<div class="list-row">' +
            '<div class="list-row__main"><div class="list-row__title">' + esc(s.Helper_Name) + ' &mdash; ' + esc(s.Role_Title) + '</div>' +
            '<div class="list-row__meta">' + esc(s.Event_Date) + ' &bull; ' + esc(s.Event_Title) + '</div></div>' +
            '<div style="display:flex; gap:6px; align-items:center;">' +
            '<span class="badge ' + (s.RSVP_Status === 'Accepted' ? 'badge--emerald' : s.RSVP_Status === 'Declined' ? 'badge--crimson' : 'badge--gold') + '">' + esc(s.RSVP_Status) + '</span>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-rsvp-local="' + esc(s.Assignment_ID) + ':Accepted">Accept</button>' +
            '</div></div>'
        )
        .join('') +
      '</div></section></div>'
    );
  }

  // ==========================================================================
  // VIEW 4: OFFERING COUNTER, ACCOUNTING, AP BILLS, PLAID & FRIDAY MATRIX
  // ==========================================================================
  function renderOfferingCounterTab() {
    const openBatches = state.data.givingBatches;
    const activeBatch = openBatches.find(b => b.Batch_ID === state.selectedBatchId) || openBatches[openBatches.length - 1];
    const batchContribs = state.data.contributions.filter(c => c.Batch_ID === activeBatch.Batch_ID);
    const batchSum = batchContribs.reduce((a, c) => a + Number(c.Amount || 0), 0);
    const isLocked = String(activeBatch.Locked) === 'Yes';

    return (
      '<div class="section-stack">' +
      '<section class="card">' +
      '<div class="card-head"><div><h1 class="card-title">Offering Batch &amp; Count Sheet Capture</h1><p class="card-subtitle">Count cash/checks, snap signed Count Sheet to <code>11_Offering_Count_Sheets</code>, and lock batch.</p></div>' +
      '<select id="batch-picker-select" class="select" style="width:auto; min-height:38px;">' +
      openBatches.map(b => '<option value="' + esc(b.Batch_ID) + '" ' + (b.Batch_ID === activeBatch.Batch_ID ? 'selected' : '') + '>' + esc(b.Description) + (b.Locked === 'Yes' ? ' (Locked)' : ' (Open)') + '</option>').join('') +
      '</select></div>' +
      '<div style="padding:12px; border-radius:10px; background:var(--bg-elevated); margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">' +
      '<span>Batch Running Total (' + batchContribs.length + ' gifts)</span><strong style="font-size:1.25rem; color:var(--gold);">' + fmtMoney(batchSum) + '</strong></div>' +
      (isLocked
        ? '<div class="alert-box alert-box--info">This batch is locked and posted to Bank of America ••9284. Create a new Sunday batch below to enter new offerings.</div>' +
          '<button type="button" id="new-sunday-batch-btn" class="btn btn--gold btn--full">+ Open New Sunday Offering Batch</button>'
        : '<form id="add-gift-form">' +
          '<div class="form-grid-2">' +
          '<div class="field"><label class="field-label" for="gift-donor">Donor Name (or Loose Cash)</label><input id="gift-donor" class="input" placeholder="e.g. Patricia Babb or Anonymous" required /></div>' +
          '<div class="field"><label class="field-label" for="gift-amount">Amount ($)</label><input id="gift-amount" type="number" step="0.01" min="0.01" class="input" placeholder="0.00" required /></div>' +
          '</div>' +
          '<div class="form-grid-2">' +
          '<div class="field"><label class="field-label" for="gift-fund">Ministry Fund</label><select id="gift-fund" class="select">' +
          '<option value="10|10-1001|Tithes">10 — General Tithes &amp; Offerings</option>' +
          '<option value="20|10-2001|Building &amp; Grounds">20 — Building Fund</option>' +
          '<option value="30|30-1001|SHIELD Youth">30 — SHIELD Children &amp; Youth</option>' +
          '<option value="70|70-1001|Celebrate Recovery / Pantry">70 — Celebrate Recovery &amp; Pantry</option>' +
          '</select></div>' +
          '<div class="field"><label class="field-label" for="gift-method">Method</label><select id="gift-method" class="select"><option>Check</option><option>Cash</option><option>Card</option><option>In-Kind</option></select></div>' +
          '</div>' +
          '<div class="field"><label class="camera-upload-label"><input type="file" id="count-sheet-photo" accept="image/*" capture="environment" /><span>📷 Snap Signed Paper Count Sheet Photo</span></label></div>' +
          '<div class="form-grid-2">' +
          '<button type="submit" class="btn btn--secondary btn--full">+ Add Gift Line</button>' +
          '<button type="button" id="lock-batch-btn" class="btn btn--emerald btn--full">Lock &amp; Post Deposit</button>' +
          '</div></form>') +
      '<div class="list-stack" style="margin-top:12px;">' +
      batchContribs
        .map(
          c =>
            '<div class="list-row"><div class="list-row__main"><div class="list-row__title">' +
            esc(c.Donor_Name) +
            '</div><div class="list-row__meta">Fund ' + esc(c.Fund_Code) + ' &bull; ' + esc(c.Category_Name) + ' &bull; ' + esc(c.Payment_Type) + '</div></div><strong>' +
            fmtMoney(c.Amount) +
            '</strong></div>'
        )
        .join('') +
      '</div></section></div>'
    );
  }

  function renderFinanceTab() {
    const finSub = state.subTab || 'ap_bills';
    const m = computeSelfCalculatingMetrics('2026-11');

    let html = '<div class="section-stack">';
    html +=
      '<div class="sub-tabs">' +
      '<button type="button" class="sub-tab-btn ' + (finSub === 'ap_bills' ? 'is-active' : '') + '" data-subtab="ap_bills">AP Bills Inbox</button>' +
      '<button type="button" class="sub-tab-btn ' + (finSub === 'transfers_tax' ? 'is-active' : '') + '" data-subtab="transfers_tax">Transfers &amp; IRS Statements</button>' +
      '<button type="button" class="sub-tab-btn ' + (finSub === 'bank_feeds' ? 'is-active' : '') + '" data-subtab="bank_feeds">Plaid / CSV Feeds</button>' +
      '<button type="button" class="sub-tab-btn ' + (finSub === 'funds_banks' ? 'is-active' : '') + '" data-subtab="funds_banks">4 Banks &amp; 5 Funds</button>' +
      '<button type="button" class="sub-tab-btn ' + (finSub === 'friday_cash' ? 'is-active' : '') + '" data-subtab="friday_cash">Friday Cash Matrix</button>' +
      '</div>';

    if (finSub === 'transfers_tax' && window.LFCDeepFeatures) {
      html += window.LFCDeepFeatures.renderAtomicTransferAndTaxStatement(state, esc, fmtMoney);
      html += '</div>';
      return html;
    }

    if (finSub === 'ap_bills') {
      html +=
        '<section class="card">' +
        '<div class="card-head"><div><h1 class="card-title">AP Bills Need Paid Inbox</h1><p class="card-subtitle">Snap vendor invoices into <code>10_AP_Bills_&_Vendor_Invoices</code> &amp; feed Friday Cash Matrix automatically</p></div></div>' +
        '<div class="list-stack" style="margin-bottom:14px;">' +
        state.data.apBills
          .map(
            b =>
              '<div class="list-row"><div class="list-row__main"><div class="list-row__title">' + esc(b.Vendor_Name) + ' &mdash; ' + fmtMoney(b.Amount) + '</div>' +
              '<div class="list-row__meta">Due ' + esc(b.Due_Date) + ' &bull; Fund ' + esc(b.Fund_Code) + ' &bull; Inv #' + esc(b.Invoice_Number) + '</div></div>' +
              (b.Status === 'Paid'
                ? '<span class="badge badge--emerald">Paid ✓</span>'
                : '<button type="button" class="btn btn--emerald btn--sm" data-pay-bill="' + esc(b.Bill_ID) + '">Mark Paid</button>') +
              '</div>'
          )
          .join('') +
        '</div>' +
        '<form id="new-ap-bill-form" style="border-top:1px solid var(--border-subtle); padding-top:12px;">' +
        '<span class="field-label" style="display:block; margin-bottom:8px;">+ Add Incoming Bill / Snap Invoice</span>' +
        '<div class="form-grid-2">' +
        '<div class="field"><input id="ap-vendor" class="input" placeholder="Vendor (e.g. Deltona Water)" required /></div>' +
        '<div class="field"><input id="ap-amount" type="number" step="0.01" class="input" placeholder="Amount ($)" required /></div>' +
        '</div>' +
        '<div class="form-grid-2">' +
        '<div class="field"><input id="ap-due" type="date" class="input" value="2026-11-28" required /></div>' +
        '<div class="field"><label class="camera-upload-label" style="min-height:46px;"><input type="file" id="ap-invoice-file" accept="image/*,application/pdf" capture="environment" /><span>📷 Attach Invoice Scan</span></label></div>' +
        '</div>' +
        '<button type="submit" class="btn btn--gold btn--full">Save Bill to Vault Queue</button></form></section>';
    } else if (finSub === 'bank_feeds') {
      const pending = state.data.bankFeed.filter(f => f.Review_Status === 'Pending');
      html +=
        '<section class="card">' +
        '<div class="card-head"><div><h1 class="card-title">Plaid Live Sync &amp; .CSV/.QBO Statement Import</h1><p class="card-subtitle">Direction-aware rules prevent fees from posting as income; Stripe deposits match locked batches</p></div>' +
        '<button type="button" id="plaid-sync-btn" class="btn btn--gold btn--sm">Sync Plaid Now</button></div>' +
        '<div class="field"><label class="camera-upload-label"><input type="file" id="bank-csv-input" accept=".csv,.qbo,.qfx" /><span>📄 Import Bank of America .CSV / .QBO Statement</span></label></div>' +
        '<div class="list-stack">' +
        (pending.length === 0
          ? '<div class="alert-box alert-box--info">All bank feed transactions reviewed and reconciled!</div>'
          : pending
              .map(
                f =>
                  '<div class="list-row"><div class="list-row__main"><div class="list-row__title">' +
                  esc(f.Description) +
                  '</div><div class="list-row__meta">' + esc(f.Posted_Date) + ' &bull; ' + esc(f.Direction.toUpperCase()) + ' &bull; Suggested Cat: ' + esc(f.Suggested_Category) + '</div></div>' +
                  '<div style="display:flex; align-items:center; gap:8px;"><strong>' + fmtMoney(f.Amount) + '</strong>' +
                  '<button type="button" class="btn btn--emerald btn--sm" data-approve-feed="' + esc(f.Feed_ID) + '">Approve</button></div></div>'
              )
              .join('')) +
        '</div></section>';
    } else if (finSub === 'funds_banks') {
      html +=
        '<section class="card"><h1 class="card-title" style="margin-bottom:10px;">4 LFC &amp; SCA Bank Accounts</h1><div class="list-stack">' +
        m.bankSummary
          .map(
            b =>
              '<div class="list-row"><div class="list-row__main"><div class="list-row__title">' + esc(b.name) + ' ••' + esc(b.mask) + '</div>' +
              '<div class="list-row__meta">Unpaid Bills Committed: ' + fmtMoney(b.unpaidBills) + ' &bull; Projected: ' + fmtMoney(b.projected) + '</div></div>' +
              '<strong>' + fmtMoney(b.liveBalance) + '</strong></div>'
          )
          .join('') +
        '</div></section>' +
        '<section class="card"><div class="card-head"><div><h2 class="card-title">5 True Ministry Funds (Replaces Broken GL Xfer Fund)</h2><p class="card-subtitle">Reconciliation Status: <strong>' + (m.drift === 0 ? 'BALANCED ($0.00 Drift)' : fmtMoney(m.drift)) + '</strong></p></div></div>' +
        '<div class="list-stack">' +
        m.fundSummary
          .map(
            f =>
              '<div class="list-row"><div class="list-row__main"><div class="list-row__title">Fund ' + esc(f.code) + ' &mdash; ' + esc(f.name) + '</div>' +
              '<div class="list-row__meta">' + (f.restricted === 'Yes' ? 'Donor Restricted' : 'Unrestricted Operating') + '</div></div>' +
              '<strong style="color:var(--emerald);">' + fmtMoney(f.liveBalance) + '</strong></div>'
          )
          .join('') +
        '</div></section>';
    } else {
      html +=
        '<section class="card">' +
        '<h1 class="card-title">Friday Treasurer Cash Position — Dee "Huney" Huchton</h1>' +
        '<p class="card-subtitle" style="margin-bottom:12px;">Live bridge between AP Bills, Bank Balances, and Friday Cash review</p>' +
        '<div class="kpi-grid" style="margin-bottom:12px;">' +
        '<div class="kpi-tile"><span class="kpi-tile__label">Cash in 4 Banks</span><div class="kpi-tile__val">' + fmtMoney(m.totalBankCash) + '</div></div>' +
        '<div class="kpi-tile"><span class="kpi-tile__label">Due Next 5 Days</span><div class="kpi-tile__val kpi-tile__val--gold">' + fmtMoney(m.totalUnpaidAp) + '</div></div>' +
        '<div class="kpi-tile"><span class="kpi-tile__label">Projected After Bills</span><div class="kpi-tile__val kpi-tile__val--emerald">' + fmtMoney(m.totalBankCash - m.totalUnpaidAp) + '</div></div>' +
        '<div class="kpi-tile"><span class="kpi-tile__label">Cushion Status</span><div class="kpi-tile__val kpi-tile__val--emerald">CLEAR ✓</div></div>' +
        '</div>' +
        '<div class="list-stack">' +
        state.data.fridayChecklist
          .map(
            item =>
              '<button type="button" class="roster-check-btn ' + (item.done ? 'is-present' : '') + '" data-toggle-friday="' + item.id + '">' +
              '<span>' + esc(item.label) + '</span>' +
              '<span class="badge ' + (item.done ? 'badge--emerald' : 'badge--gold') + '">' + (item.done ? 'Done ✓' : 'Pending') + '</span></button>'
          )
          .join('') +
        '</div></section>';
    }

    html += '</div>';
    return html;
  }

  // ==========================================================================
  // VIEW 5: SUPER ADMIN USER PROVISIONING & PILOT FEEDBACK CONSOLE
  // ==========================================================================
  function renderSuperAdminUsersTab() {
    if (!state.user || state.user.role !== 'super_admin') {
      return '<section class="card"><h1 class="card-title">Super Admin Only</h1><p class="card-subtitle">Only Super Admins (Pastor Joel &amp; Board Secretary Yaresly Godwin) can provision accounts.</p></section>';
    }

    const pilotSection = window.LFCDeepFeatures
      ? window.LFCDeepFeatures.renderPilotShareAndFeedbackAdmin(state, esc, showToast, callVaultApi, renderMainWorkspace)
      : '';

    return (
      '<div class="section-stack">' +
      pilotSection +
      '<section class="card card--action-hero">' +
      '<span class="eyebrow-tag">SUPER ADMIN PROVISIONING (PASTOR JOEL &amp; YARESLY GODWIN)</span>' +
      '<h1 class="card-title" style="margin-top:6px;">Provision New Ministry Helper or Board Account</h1>' +
      '<p class="card-subtitle" style="margin-bottom:14px;">Creates a salted SHA-256 credential inside <code>01_LFC_System_Auth_&amp;_Audit</code> with exact module &amp; ministry scopes.</p>' +
      '<form id="provision-user-form">' +
      '<div class="form-grid-2">' +
      '<div class="field"><label class="field-label" for="prov-fullname">Full Name</label><input id="prov-fullname" class="input" placeholder="e.g. Lawton Stacey" required /></div>' +
      '<div class="field"><label class="field-label" for="prov-username">Unique Username</label><input id="prov-username" class="input" placeholder="e.g. lawton.av" autocapitalize="none" required /></div>' +
      '</div>' +
      '<div class="form-grid-2">' +
      '<div class="field"><label class="field-label" for="prov-password">Temporary Password (8+ chars)</label><input id="prov-password" class="input" value="LFC-Helper-2026!" minlength="8" required /></div>' +
      '<div class="field"><label class="field-label" for="prov-role">Role Preset</label><select id="prov-role" class="select">' +
      '<option value="ministry_helper">Ministry Helper (Scoped)</option>' +
      '<option value="ministry_director">Children\'s, SHIELD &amp; SCA Director (No Banking)</option>' +
      '<option value="board_member">Church Board Member (Reports Only)</option>' +
      '<option value="worship_team">Worship / AV Team Member</option>' +
      '<option value="worship_leader">Worship Leader &amp; Area Head</option>' +
      '<option value="offering_counter">Offering Counter</option>' +
      '<option value="treasurer">Church Treasurer</option>' +
      '<option value="super_admin">Super Admin (Full Access)</option>' +
      '</select></div>' +
      '</div>' +
      '<div class="form-grid-2">' +
      '<div class="field"><label class="field-label" for="prov-email">Email (Optional)</label><input id="prov-email" type="email" class="input" placeholder="helper@deltonanaz.com" /></div>' +
      '<div class="field"><label class="field-label" for="prov-phone">Mobile Phone (for SMS Invites)</label><input id="prov-phone" type="tel" class="input" placeholder="(386) 555-0100" /></div>' +
      '</div>' +
      '<div class="field"><span class="field-label">Ministry Group Scopes (Restricts Attendance &amp; Rosters)</span>' +
      '<div class="checkbox-grid" id="prov-scopes-box">' +
      CFG.allMinistryScopes
        .map(
          sc =>
            '<label class="chk-pill"><input type="checkbox" name="prov_scope" value="' + esc(sc) + '" ' + (sc === 'Children' ? 'checked' : '') + ' /><span>' + esc(sc) + '</span></label>'
        )
        .join('') +
      '</div></div>' +
      '<div class="field"><span class="field-label">Permitted App Modules</span>' +
      '<div class="checkbox-grid" id="prov-modules-box">' +
      CFG.allModuleOptions
        .map(
          m =>
            '<label class="chk-pill"><input type="checkbox" name="prov_mod" value="' + esc(m.id) + '" ' +
            (['dashboard', 'attendance', 'schedules_my'].indexOf(m.id) !== -1 ? 'checked' : '') +
            ' /><span>' + esc(m.label) + '</span></label>'
        )
        .join('') +
      '</div></div>' +
      '<button type="submit" id="create-helper-btn" class="btn btn--gold btn--full">+ Create Helper Account &amp; Permissions</button>' +
      '</form></section>' +
      '<section class="card">' +
      '<div class="card-head"><div><h2 class="card-title">Provisioned Leaders &amp; Helpers (' + state.data.users.length + ')</h2><p class="card-subtitle">Reset passwords or suspend phone sessions in 1 tap</p></div>' +
      '<a class="btn btn--secondary btn--sm" href="' + esc(CFG.vault.workbooks.auth.url) + '" target="_blank" rel="noopener">Open 01_Auth Sheet &nearr;</a></div>' +
      '<div class="list-stack">' +
      state.data.users
        .map(
          u =>
            '<div class="list-row">' +
            '<div class="list-row__main">' +
            '<div class="list-row__title">' + esc(u.fullName) + ' <code>@' + esc(u.username) + '</code></div>' +
            '<div class="list-row__meta">Role: <strong>' + esc(u.role) + '</strong> &bull; Scopes: ' + esc(u.ministryScopes) + '</div>' +
            '</div>' +
            '<div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">' +
            '<span class="badge ' + (u.active !== false ? 'badge--emerald' : 'badge--crimson') + '">' + (u.active !== false ? 'Active' : 'Suspended') + '</span>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-reset-pw="' + esc(u.userId) + '">Reset PW</button>' +
            (u.username !== 'PastorJoel'
              ? '<button type="button" class="btn btn--crimson btn--sm" data-toggle-user="' + esc(u.userId) + '">' + (u.active !== false ? 'Suspend' : 'Activate') + '</button>'
              : '') +
            '</div></div>'
        )
        .join('') +
      '</div></section></div>'
    );
  }

  // ==========================================================================
  // VIEW 6: PUBLIC CONGREGATION PORTAL (?view=connect) & 1-TAP RSVP (?rsvp=)
  // ==========================================================================
  function renderPublicPortalTab(tabId) {
    if (tabId === 'pub_connect') {
      return renderVisitorCardEntry();
    }
    if (tabId === 'pub_events') {
      return (
        '<section class="card"><h1 class="card-title">Upcoming Events at Life Fellowship Church</h1>' +
        '<p class="card-subtitle" style="margin-bottom:12px;">1420 Courtland Blvd, Deltona, FL 32738 &bull; Publicly published events only</p>' +
        '<div class="list-stack">' +
        state.data.events
          .filter(ev => String(ev.Published_Public) === 'Yes')
          .map(
            ev =>
              '<div class="list-row"><div class="list-row__main"><div class="list-row__title">' + esc(ev.Title) + '</div>' +
              '<div class="list-row__meta">' + esc(ev.Event_Date) + ' at ' + esc(ev.Start_Time) + ' &bull; ' + esc(ev.Location) + '</div></div>' +
              '<span class="badge badge--gold">' + esc(ev.Ministry_Scope) + '</span></div>'
          )
          .join('') +
        '</div></section>'
      );
    }
    if (tabId === 'pub_prayer') {
      return (
        '<section class="card"><h1 class="card-title">Submit a Prayer Request</h1>' +
        '<p class="card-subtitle" style="margin-bottom:12px;">Shared directly with Pastor Joel and our prayer ministry team</p>' +
        '<form id="public-prayer-form">' +
        '<div class="field"><label class="field-label" for="pray-name">Your Name</label><input id="pray-name" class="input" placeholder="Your Name (or Anonymous)" required /></div>' +
        '<div class="field"><label class="field-label" for="pray-body">How Can We Pray For You?</label><textarea id="pray-body" class="textarea" required></textarea></div>' +
        '<button type="submit" class="btn btn--gold btn--full">Send Prayer Request</button></form></section>'
      );
    }
    if (tabId === 'pub_give') {
      return (
        '<section class="card card--action-hero"><span class="eyebrow-tag">SECURE STRIPE CHECKOUT</span>' +
        '<h1 class="card-title" style="margin-top:8px;">Online Giving &mdash; Life Fellowship Church</h1>' +
        '<p class="card-subtitle" style="margin-bottom:14px;">Support Tithes, SHIELD Youth, Building Fund, or Celebrate Recovery &amp; Food Pantry.</p>' +
        '<form id="stripe-give-form">' +
        '<div class="form-grid-2">' +
        '<div class="field"><label class="field-label" for="stripe-amt">Gift Amount ($)</label><input id="stripe-amt" type="number" min="1" step="0.01" class="input" value="50.00" required /></div>' +
        '<div class="field"><label class="field-label" for="stripe-fund">Designation</label><select id="stripe-fund" class="select">' +
        '<option>Tithes &amp; General Offering</option><option>Building &amp; Grounds (Fund 20)</option><option>SHIELD Children &amp; Youth (Fund 30)</option><option>Celebrate Recovery &amp; Food Pantry (Fund 70)</option></select></div>' +
        '</div>' +
        '<button type="submit" class="btn btn--gold btn--full">Continue to Secure Stripe Checkout &rarr;</button></form></section>'
      );
    }
    return renderWorshipStageView();
  }

  function renderRsvpMagicTab() {
    const asg = state.rsvpAssignment || state.data.schedules[2];
    return (
      '<section class="card card--action-hero">' +
      '<span class="eyebrow-tag">1-TAP MINISTRY SCHEDULE RSVP</span>' +
      '<h1 class="card-title" style="margin-top:8px;">Hi ' + esc(asg.Helper_Name) + '!</h1>' +
      '<p class="card-subtitle" style="margin-bottom:14px;">You are invited to serve as <strong>' + esc(asg.Role_Title) + '</strong> for <strong>' + esc(asg.Event_Title) + '</strong> on <strong>' + esc(asg.Event_Date) + '</strong>.</p>' +
      '<div class="form-grid-2">' +
      '<button type="button" class="btn btn--emerald btn--full" data-magic-rsvp="Accepted">✓ Yes, I Can Serve</button>' +
      '<button type="button" class="btn btn--crimson btn--full" data-magic-rsvp="Declined">✕ Unable This Week</button>' +
      '</div></section>'
    );
  }

  // ==========================================================================
  // PILOT TESTER LAUNCHER & EVENT DELEGATION
  // ==========================================================================
  function launchPilotUserByKey(pilotKey) {
    const testers = CFG.pilotTesters || [];
    const found = testers.find(t => t.key === String(pilotKey || '').toLowerCase());
    if (!found) return false;
    const preset = CFG.rolePresets[found.role] || CFG.rolePresets.ministry_helper;
    state.mode = 'staff';
    state.isSimulated = true;
    state.user = {
      userId: 'usr_' + found.key,
      username: found.username,
      fullName: found.fullName,
      role: found.role,
      allowedModules: preset.defaultModules.slice(),
      ministryScopes: found.scopes.slice()
    };
    state.subTab = '';
    state.activeTab = 'home';
    enterShell();
    showToast('Pilot Mode: ' + found.fullName + ' (' + found.area + ')');
    return true;
  }

  function bindEvents() {
    if (window.LFCDeepFeatures) {
      window.LFCDeepFeatures.bindGlobalModals(state, showToast, callVaultApi, renderMainWorkspace);
    }

    // Theme toggle
    const applyTheme = t => {
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem(STORAGE_KEYS.THEME, t);
    };
    applyTheme(localStorage.getItem(STORAGE_KEYS.THEME) || 'dark');

    const flipTheme = () => {
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    };
    document.getElementById('theme-toggle-btn').addEventListener('click', flipTheme);
    document.getElementById('auth-theme-btn').addEventListener('click', flipTheme);

    // Show/hide password
    document.getElementById('toggle-pw-btn').addEventListener('click', function () {
      const inp = document.getElementById('login-password');
      const isPw = inp.type === 'password';
      inp.type = isPw ? 'text' : 'password';
      this.textContent = isPw ? 'Hide' : 'Show';
    });

    // Entry mode buttons on login card (Staff | Public Connect | Worship Stage)
    document.querySelectorAll('[data-entry-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-entry-mode');
        if (mode === 'connect') {
          state.mode = 'public';
          state.activeTab = 'pub_connect';
          enterShell();
        } else if (mode === 'worship') {
          state.mode = 'worship_public';
          state.activeTab = 'worship_stage';
          enterShell();
        }
      });
    });

    // Save GAS Endpoint URL
    const gasInput = document.getElementById('gas-url-input');
    gasInput.value = state.gasUrl;
    const refreshGasBadge = () => {
      const b = document.getElementById('gas-status-badge');
      b.textContent = state.gasUrl ? 'Vault Connected ✓' : 'Pilot Simulator';
      b.className = 'badge ' + (state.gasUrl ? 'badge--emerald' : 'badge--gold');
    };
    refreshGasBadge();

    document.getElementById('save-gas-url-btn').addEventListener('click', () => {
      state.gasUrl = gasInput.value.trim();
      localStorage.setItem(STORAGE_KEYS.GAS_URL, state.gasUrl);
      refreshGasBadge();
      showToast(state.gasUrl ? 'Saved Google Apps Script Vault URL!' : 'Cleared endpoint (Pilot Simulator mode)');
    });

    // Pilot Team Quick-Try buttons (Joel, Yaresly, Huney, Wayne, Patricia, Sarah)
    document.querySelectorAll('[data-pilot-key]').forEach(btn => {
      btn.addEventListener('click', () => {
        launchPilotUserByKey(btn.getAttribute('data-pilot-key'));
      });
    });

    // Real Staff Login Submit
    document.getElementById('staff-login-form').addEventListener('submit', async ev => {
      ev.preventDefault();
      const alertEl = document.getElementById('auth-alert');
      alertEl.hidden = true;
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      const remember = document.getElementById('remember-device-chk').checked;

      if (!state.gasUrl) {
        alertEl.textContent = 'Deploy apps-script/Code.gs and paste your Web App /exec URL in "Google Drive Vault Sync Endpoint" below — or tap any Role Simulator button to preview right now!';
        alertEl.hidden = false;
        return;
      }

      const btn = document.getElementById('login-submit-btn');
      btn.disabled = true;
      btn.textContent = 'Verifying in Vault...';
      try {
        const res = await callVaultApi('login', {
          username: username,
          password: password,
          rememberDevice: remember,
          deviceInfo: navigator.userAgent
        });
        if (!res.ok) {
          alertEl.textContent = res.error || 'Invalid username or password.';
          alertEl.hidden = false;
          return;
        }
        state.isSimulated = false;
        state.mode = 'staff';
        state.sessionToken = res.sessionToken;
        state.user = res.user;
        localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, res.sessionToken);

        const boot = await callVaultApi('bootstrapApp', { forceRefresh: true });
        if (boot.ok) mergeServerBootstrap(boot);
        enterShell();
      } catch (err) {
        alertEl.textContent = 'Connection error: ' + err.message;
        alertEl.hidden = false;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Sign In to Ministry Hub';
      }
    });

    // First-login password change
    document.getElementById('change-pw-form').addEventListener('submit', async ev => {
      ev.preventDefault();
      const newPw = document.getElementById('new-personal-pw').value;
      const res = await callVaultApi('changeOwnPassword', { newPassword: newPw });
      if (res.ok) {
        state.user.mustChangePassword = false;
        showToast('Password updated!');
        enterShell();
      } else {
        showToast(res.error || 'Could not update password');
      }
    });

    // Sign out / Exit
    document.getElementById('sign-out-btn').addEventListener('click', async () => {
      if (state.sessionToken && state.gasUrl && !state.isSimulated) {
        try { await callVaultApi('logout', {}); } catch (_) {}
      }
      state.sessionToken = '';
      state.user = null;
      localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
      document.getElementById('app-shell').hidden = true;
      document.getElementById('auth-screen').hidden = false;
    });

    // Sync refresh
    document.getElementById('sync-refresh-btn').addEventListener('click', async () => {
      if (window.LFCDeepFeatures && window.LFCDeepFeatures.syncLivePilotFeedback) {
        await window.LFCDeepFeatures.syncLivePilotFeedback(state, renderMainWorkspace);
      }
      if (state.gasUrl && state.sessionToken && !state.isSimulated) {
        const boot = await callVaultApi('bootstrapApp', { forceRefresh: true });
        if (boot.ok) {
          mergeServerBootstrap(boot);
          renderMainWorkspace();
          showToast('Synced live with Google Drive Vault & Feedback Relay!');
          return;
        }
      }
      renderMainWorkspace();
      showToast('Synced live Pilot Feedback & recalculated Vault rollups!');
    });

    // Bottom Navigation clicks
    document.getElementById('role-bottom-nav').addEventListener('click', ev => {
      const btn = ev.target.closest('[data-nav-id]');
      if (!btn) return;
      state.activeTab = btn.getAttribute('data-nav-id');
      state.subTab = '';
      renderNavBar(getNavTabsForCurrentSession());
      renderMainWorkspace();
      if (state.activeTab === 'admin_users' && window.LFCDeepFeatures && window.LFCDeepFeatures.syncLivePilotFeedback) {
        window.LFCDeepFeatures.syncLivePilotFeedback(state, renderMainWorkspace);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Delegated Workspace Clicks, Changes & Submits
    const main = document.getElementById('workspace-main');

    main.addEventListener('click', async ev => {
      const jump = ev.target.closest('[data-jump-tab]');
      if (jump) {
        state.activeTab = jump.getAttribute('data-jump-tab');
        state.subTab = '';
        renderNavBar(getNavTabsForCurrentSession());
        renderMainWorkspace();
        return;
      }

      const sub = ev.target.closest('[data-subtab]');
      if (sub) {
        state.subTab = sub.getAttribute('data-subtab');
        renderMainWorkspace();
        return;
      }

      const step = ev.target.closest('[data-step]');
      if (step) {
        const parts = step.getAttribute('data-step').split(':');
        const delta = Number(parts[1]);
        if (parts[0] === 'adults') state.attHeadcountAdults = Math.max(0, state.attHeadcountAdults + delta);
        if (parts[0] === 'kids') state.attHeadcountKids = Math.max(0, state.attHeadcountKids + delta);
        if (parts[0] === 'guests') state.attFirstTimers = Math.max(0, state.attFirstTimers + delta);
        if (parts[0] === 'unnamed') state.attUnnamedGuests = Math.max(0, state.attUnnamedGuests + delta);
        renderMainWorkspace();
        return;
      }

      if (ev.target.id === 'save-sunday-headcount-btn') {
        const today = new Date().toISOString().slice(0, 10);
        const monthKey = '2026-11';
        state.data.attendanceSessions.push(
          { Session_ID: 'att_' + Date.now() + 'a', Month_Key: monthKey, Session_Date: today, Ministry_Category: 'Sunday Worship - Adults', Total_Attendance: state.attHeadcountAdults, First_Time_Visitors: state.attFirstTimers },
          { Session_ID: 'att_' + Date.now() + 'k', Month_Key: monthKey, Session_Date: today, Ministry_Category: 'Sunday Worship - Children', Total_Attendance: state.attHeadcountKids, First_Time_Visitors: 0 }
        );
        if (state.gasUrl && !state.isSimulated) {
          await callVaultApi('recordAttendance', { sessionDate: today, ministryCategory: 'Sunday Worship - Adults', totalAttendance: state.attHeadcountAdults, firstTimeVisitors: state.attFirstTimers });
          await callVaultApi('recordAttendance', { sessionDate: today, ministryCategory: 'Sunday Worship - Children', totalAttendance: state.attHeadcountKids, firstTimeVisitors: 0 });
        }
        showToast('Saved Sunday Headcount (' + (state.attHeadcountAdults + state.attHeadcountKids) + ') & updated Month-End Averages!');
        renderMainWorkspace();
        return;
      }

      const togglePerson = ev.target.closest('[data-toggle-person]');
      if (togglePerson) {
        const pid = togglePerson.getAttribute('data-toggle-person');
        state.attRosterChecked[pid] = !state.attRosterChecked[pid];
        renderMainWorkspace();
        return;
      }

      if (ev.target.id === 'save-roster-session-btn') {
        const grpSel = document.getElementById('roster-group-select');
        const cat = grpSel ? grpSel.value : 'Celebrate Recovery';
        const namedCnt = Object.values(state.attRosterChecked).filter(Boolean).length;
        const total = namedCnt + state.attUnnamedGuests;
        state.data.attendanceSessions.push({
          Session_ID: 'att_' + Date.now(),
          Month_Key: '2026-11',
          Session_Date: '2026-11-25',
          Ministry_Category: cat,
          Total_Attendance: total,
          First_Time_Visitors: 0
        });
        if (state.gasUrl && !state.isSimulated) {
          await callVaultApi('recordAttendance', { sessionDate: '2026-11-25', ministryCategory: cat, namedPresent: namedCnt, unnamedGuests: state.attUnnamedGuests, totalAttendance: total });
        }
        showToast('Recorded ' + cat + ' attendance (' + total + ')!');
        renderMainWorkspace();
        return;
      }

      const fupBtn = ev.target.closest('[data-complete-fup]');
      if (fupBtn) {
        const subId = fupBtn.getAttribute('data-complete-fup');
        const v = state.data.visitors.find(x => x.Submission_ID === subId);
        if (v) v.Follow_Up_Status = 'Completed';
        if (state.gasUrl && !state.isSimulated) {
          await callVaultApi('updateFollowUpStatus', { submissionId: subId, status: 'Completed' });
        }
        showToast('Marked Pastoral Follow-Up Completed!');
        renderMainWorkspace();
        return;
      }

      const openSong = ev.target.closest('[data-open-song]');
      if (openSong) {
        state.selectedSongId = openSong.getAttribute('data-open-song');
        state.selectedKey = openSong.getAttribute('data-open-key') || 'G';
        state.activeTab = 'worship_stage';
        renderNavBar(getNavTabsForCurrentSession());
        renderMainWorkspace();
        return;
      }

      if (ev.target.id === 'toggle-chords-btn') {
        state.showChords = !state.showChords;
        renderMainWorkspace();
        return;
      }
      if (ev.target.id === 'font-smaller-btn') {
        state.chordFontSize = Math.max(12, state.chordFontSize - 2);
        renderMainWorkspace();
        return;
      }
      if (ev.target.id === 'font-larger-btn') {
        state.chordFontSize = Math.min(26, state.chordFontSize + 2);
        renderMainWorkspace();
        return;
      }

      const rsvpLocal = ev.target.closest('[data-rsvp-local]');
      if (rsvpLocal) {
        const [asgId, status] = rsvpLocal.getAttribute('data-rsvp-local').split(':');
        const row = state.data.schedules.find(s => s.Assignment_ID === asgId);
        if (row) row.RSVP_Status = status;
        showToast('Updated RSVP to ' + status + '!');
        renderMainWorkspace();
        return;
      }

      const magicBtn = ev.target.closest('[data-magic-rsvp]');
      if (magicBtn) {
        const st = magicBtn.getAttribute('data-magic-rsvp');
        if (state.gasUrl && state.rsvpToken) {
          await callVaultApi('respondRsvp', { token: state.rsvpToken, status: st });
        }
        showToast('Thank you! Your RSVP (' + st + ') has been recorded.');
        return;
      }

      if (ev.target.id === 'new-sunday-batch-btn') {
        const newId = 'bat_' + Date.now();
        state.data.givingBatches.push({
          Batch_ID: newId,
          Month_Key: '2026-11',
          Batch_Date: '2026-11-29',
          Batch_Type: 'In-Person Giving',
          Description: 'November 29, 2026 (Sunday Offering)',
          Locked: 'No'
        });
        state.selectedBatchId = newId;
        if (state.gasUrl && !state.isSimulated) {
          await callVaultApi('createGivingBatch', { batchDate: '2026-11-29', batchType: 'In-Person Giving', description: 'November 29, 2026 (Sunday Offering)' });
        }
        showToast('Opened new Sunday Offering Batch!');
        renderMainWorkspace();
        return;
      }

      if (ev.target.id === 'lock-batch-btn') {
        const b = state.data.givingBatches.find(x => x.Batch_ID === state.selectedBatchId);
        if (b && b.Locked !== 'Yes') {
          const items = state.data.contributions.filter(c => c.Batch_ID === b.Batch_ID);
          items.forEach(c => {
            if (c.Payment_Type !== 'In-Kind') {
              state.data.ledger.push({
                Line_ID: 'ln_' + Date.now() + Math.random(),
                Bank_Account_ID: 'bnk_boa_9284',
                Signed_Cash_Impact: Number(c.Amount),
                Payee_Description: b.Description,
                Fund_Code: c.Fund_Code
              });
            }
          });
          b.Locked = 'Yes';
          if (state.gasUrl && !state.isSimulated) {
            await callVaultApi('lockGivingBatch', { batchId: b.Batch_ID, bankAccountId: 'bnk_boa_9284' });
          }
          showToast('Batch locked & auto-posted to Bank of America ••9284 ($0.00 Fund Drift)!');
          renderMainWorkspace();
        }
        return;
      }

      const payBill = ev.target.closest('[data-pay-bill]');
      if (payBill) {
        const billId = payBill.getAttribute('data-pay-bill');
        const bill = state.data.apBills.find(x => x.Bill_ID === billId);
        if (bill && bill.Status !== 'Paid') {
          bill.Status = 'Paid';
          state.data.ledger.push({
            Line_ID: 'ln_' + Date.now(),
            Bank_Account_ID: bill.Pay_From_Account_ID,
            Signed_Cash_Impact: -Math.abs(Number(bill.Amount)),
            Payee_Description: bill.Vendor_Name,
            Fund_Code: bill.Fund_Code
          });
          if (state.gasUrl && !state.isSimulated) {
            await callVaultApi('payApBill', { billId: billId });
          }
          showToast('Marked ' + bill.Vendor_Name + ' Paid & updated Bank + Fund ledgers!');
          renderMainWorkspace();
        }
        return;
      }

      const appFeed = ev.target.closest('[data-approve-feed]');
      if (appFeed) {
        const fid = appFeed.getAttribute('data-approve-feed');
        const f = state.data.bankFeed.find(x => x.Feed_ID === fid);
        if (f) {
          f.Review_Status = 'Approved';
          state.data.ledger.push({
            Line_ID: 'ln_' + Date.now(),
            Bank_Account_ID: f.Bank_Account_ID,
            Signed_Cash_Impact: f.Direction === 'credit' ? Number(f.Amount) : -Number(f.Amount),
            Payee_Description: f.Description,
            Fund_Code: f.Suggested_Fund
          });
          if (state.gasUrl && !state.isSimulated) {
            await callVaultApi('approveBankFeedItem', { feedId: fid });
          }
          showToast('Approved bank feed item into Ledger!');
          renderMainWorkspace();
        }
        return;
      }

      if (ev.target.id === 'plaid-sync-btn') {
        if (state.gasUrl && !state.isSimulated) {
          const res = await callVaultApi('plaidSync', {});
          showToast(res.ok ? 'Synced ' + res.syncedCount + ' Plaid transactions!' : res.error);
        } else {
          showToast('Plaid Sync ready — add PLAID_CLIENT_ID & PLAID_SECRET in Apps Script ScriptProperties');
        }
        return;
      }

      const friChk = ev.target.closest('[data-toggle-friday]');
      if (friChk) {
        const cid = Number(friChk.getAttribute('data-toggle-friday'));
        const item = state.data.fridayChecklist.find(x => x.id === cid);
        if (item) item.done = !item.done;
        renderMainWorkspace();
        return;
      }

      const resetBtn = ev.target.closest('[data-reset-pw]');
      if (resetBtn) {
        const uid = resetBtn.getAttribute('data-reset-pw');
        const u = state.data.users.find(x => x.userId === uid);
        const temp = window.prompt('Enter new temporary password (8+ chars) for ' + (u ? u.fullName : uid) + ':', 'LFC-Reset-2026!');
        if (temp && temp.length >= 8) {
          if (state.gasUrl && !state.isSimulated) {
            await callVaultApi('resetUserPassword', { userId: uid, tempPassword: temp });
          }
          showToast('Reset password for @' + (u ? u.username : uid) + ' (must change on next sign-in)');
        }
        return;
      }

      const togUser = ev.target.closest('[data-toggle-user]');
      if (togUser) {
        const uid = togUser.getAttribute('data-toggle-user');
        const u = state.data.users.find(x => x.userId === uid);
        if (u) {
          u.active = u.active === false;
          if (state.gasUrl && !state.isSimulated) {
            await callVaultApi('toggleUserActive', { userId: uid, active: u.active });
          }
          showToast((u.active ? 'Reactivated ' : 'Suspended ') + '@' + u.username);
          renderMainWorkspace();
        }
        return;
      }

      const copyPilot = ev.target.closest('[data-copy-pilot]');
      if (copyPilot) {
        const link = copyPilot.getAttribute('data-copy-pilot');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          try { await navigator.clipboard.writeText(link); } catch (_) {}
        }
        showToast('Copied Pilot Phone Link: ' + link);
        return;
      }

      const resolveFb = ev.target.closest('[data-resolve-fb]');
      if (resolveFb) {
        const fbId = resolveFb.getAttribute('data-resolve-fb');
        const item = (state.data.pilotFeedback || []).find(f => f.Feedback_ID === fbId);
        if (item) item.Status = 'Done';
        if (window.LFCDeepFeatures && window.LFCDeepFeatures.publishFeedbackStatusUpdate) {
          await window.LFCDeepFeatures.publishFeedbackStatusUpdate(fbId, 'Done');
        }
        if (state.gasUrl && !state.isSimulated) {
          await callVaultApi('updatePilotFeedbackStatus', { feedbackId: fbId, status: 'Done' });
        }
        showToast('Marked pilot feedback Done!');
        renderMainWorkspace();
        return;
      }

      if (ev.target.id === 'refresh-pilot-fb-btn') {
        if (window.LFCDeepFeatures && window.LFCDeepFeatures.syncLivePilotFeedback) {
          const merged = await window.LFCDeepFeatures.syncLivePilotFeedback(state, renderMainWorkspace);
          showToast('Checked live relay (' + merged.length + ' total feedback items)');
        }
        return;
      }

      if (ev.target.id === 'print-stmt-btn') {
        window.print();
      }
    });

    main.addEventListener('input', ev => {
      if (ev.target.id === 'dir-search-input') {
        const pos = ev.target.selectionStart;
        state.dirQuery = ev.target.value;
        renderMainWorkspace();
        const el = document.getElementById('dir-search-input');
        if (el) {
          el.focus();
          try { el.setSelectionRange(pos, pos); } catch (_) {}
        }
      }
    });

    const parseCsvRows = text => {
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length < 2) return [];
      const splitLine = line => {
        const out = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            inQuotes = !inQuotes;
          } else if (ch === ',' && !inQuotes) {
            out.push(cur.trim());
            cur = '';
          } else {
            cur += ch;
          }
        }
        out.push(cur.trim());
        return out;
      };
      const headers = splitLine(lines[0]);
      return lines.slice(1).map(ln => {
        const vals = splitLine(ln);
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = vals[idx] || ''; });
        return obj;
      });
    };

    main.addEventListener('change', async ev => {
      if (ev.target.id === 'report-month-select') {
        state.reportMonth = ev.target.value;
        renderMainWorkspace();
      } else if (ev.target.id === 'dir-status-select') {
        state.dirStatusFilter = ev.target.value;
        renderMainWorkspace();
      } else if (ev.target.id === 'stmt-donor-select') {
        state.statementDonor = ev.target.value;
        renderMainWorkspace();
      } else if (ev.target.id === 'stage-song-select') {
        state.selectedSongId = ev.target.value;
        const s = state.data.songs.find(x => x.Song_ID === state.selectedSongId);
        if (s) state.selectedKey = s.Default_Key || 'G';
        renderMainWorkspace();
      } else if (ev.target.id === 'stage-key-select') {
        state.selectedKey = ev.target.value;
        renderMainWorkspace();
      } else if (ev.target.id === 'batch-picker-select') {
        state.selectedBatchId = ev.target.value;
        renderMainWorkspace();
      } else if (ev.target.id === 'prov-role') {
        const preset = CFG.rolePresets[ev.target.value];
        if (preset) {
          document.querySelectorAll('input[name="prov_mod"]').forEach(chk => {
            chk.checked = preset.defaultModules.indexOf('*') !== -1 || preset.defaultModules.indexOf(chk.value) !== -1;
          });
        }
      } else if (ev.target.id === 'vis-photo-input' || ev.target.id === 'count-sheet-photo' || ev.target.id === 'ap-invoice-file') {
        const file = ev.target.files && ev.target.files[0];
        if (file) {
          const compressed = await compressImageFile(file);
          state.pendingPhotoBase64 = compressed.base64;
          state.pendingPhotoName = compressed.name;
          showToast('Photo ready for Google Drive Vault upload: ' + compressed.name);
          if (ev.target.id === 'vis-photo-input') renderMainWorkspace();
        }
      } else if (ev.target.id === 'ct-people-csv-input' || ev.target.id === 'ct-giving-csv-input') {
        const file = ev.target.files && ev.target.files[0];
        if (file) {
          const isPeople = ev.target.id === 'ct-people-csv-input';
          const parsed = parseCsvRows(await file.text());
          let imported = 0;
          parsed.forEach((r, idx) => {
            const fullCheck = JSON.stringify(r).toLowerCase();
            if (fullCheck.indexOf('cameron white') !== -1) return;
            if (isPeople) {
              const fn = r['First Name'] || r.First_Name || (r.Name ? r.Name.split(' ')[0] : '');
              const ln = r['Last Name'] || r.Last_Name || (r.Name ? r.Name.split(' ').slice(1).join(' ') : '');
              if (fn || ln) {
                state.data.people.push({
                  Person_ID: 'per_csv_' + Date.now() + '_' + idx,
                  First_Name: fn,
                  Last_Name: ln,
                  Member_Status: r['Member Status'] || r.Member_Status || 'Visitor',
                  Mobile_Phone: r['Mobile Phone'] || r.Phone || '',
                  Email: r.Email || ''
                });
                imported++;
              }
            } else {
              const amt = parseFloat(String(r.Amount || '0').replace(/[^0-9.-]/g, '')) || 0;
              if (amt > 0) {
                const gDate = r.Date || r.Gift_Date || '2026-11-23';
                state.data.contributions.push({
                  Contribution_ID: 'cnt_csv_' + Date.now() + '_' + idx,
                  Month_Key: gDate.slice(0, 7),
                  Gift_Date: gDate,
                  Batch_ID: state.selectedBatchId,
                  Donor_Name: r.Name || r.Donor_Name || 'Donor',
                  Amount: amt,
                  Category_Code: '10-1001',
                  Category_Name: r.Category || 'Tithes & Offerings',
                  Fund_Code: '10',
                  Payment_Type: r['Payment Type'] || r.Method || 'Check'
                });
                imported++;
              }
            }
          });
          if (state.gasUrl && !state.isSimulated && parsed.length) {
            await callVaultApi('bulkImportChurchTracCsv', { importType: isPeople ? 'people' : 'giving', rows: parsed });
          }
          showToast('Imported ' + imported + ' ChurchTrac ' + (isPeople ? 'People' : 'Giving') + ' rows!');
          renderMainWorkspace();
        }
      } else if (ev.target.id === 'bank-csv-input') {
        const file = ev.target.files && ev.target.files[0];
        if (file) {
          const text = await file.text();
          const lines = text.split(/\r?\n/).slice(1).filter(Boolean);
          let count = 0;
          lines.forEach((ln, idx) => {
            const cols = ln.split(',');
            if (cols.length >= 3) {
              const amt = parseFloat(cols[2].replace(/[^0-9.-]/g, '')) || 0;
              state.data.bankFeed.push({
                Feed_ID: 'fd_csv_' + Date.now() + idx,
                Bank_Account_ID: 'bnk_boa_9284',
                Posted_Date: cols[0].trim() || '2026-11-23',
                Description: cols[1].replace(/"/g, '').trim(),
                Direction: amt >= 0 ? 'credit' : 'debit',
                Amount: Math.abs(amt),
                Suggested_Category: amt >= 0 ? '10-1001' : '10-5202',
                Suggested_Fund: '10',
                Review_Status: 'Pending'
              });
              count++;
            }
          });
          showToast('Imported ' + count + ' statement lines into Bank Feed Staging!');
          renderMainWorkspace();
        }
      }
    });

    main.addEventListener('submit', async ev => {
      ev.preventDefault();
      const fid = ev.target.id;

      if (fid === 'visitor-card-form') {
        const fullName = document.getElementById('vis-name').value.trim();
        const phone = document.getElementById('vis-phone').value.trim();
        const guestStatus = document.getElementById('vis-status').value;
        const decisionToday = document.getElementById('vis-decision').value;
        const prayerRequest = document.getElementById('vis-prayer').value.trim();
        state.data.visitors.push({
          Submission_ID: 'vis_' + Date.now(),
          Month_Key: '2026-11',
          Visit_Date: '2026-11-23',
          Full_Name: fullName,
          Phone: phone,
          Guest_Status: guestStatus,
          Ministry_Source: 'Sunday Worship',
          Decision_Today: decisionToday,
          Prayer_Request: prayerRequest,
          Follow_Up_Status: 'Pending'
        });
        if (state.gasUrl && !state.isSimulated) {
          await callVaultApi('submitConnectCard', {
            visitDate: '2026-11-23',
            fullName: fullName,
            phone: phone,
            guestStatus: guestStatus,
            decisionToday: decisionToday,
            prayerRequest: prayerRequest,
            photoBase64: state.pendingPhotoBase64,
            photoFilename: state.pendingPhotoName
          });
        }
        state.pendingPhotoBase64 = '';
        state.pendingPhotoName = '';
        showToast('Saved Visitor Card & updated Monthly Visitor Rollup!');
        ev.target.reset();
        renderMainWorkspace();
      } else if (fid === 'add-person-form') {
        const fn = document.getElementById('np-first').value.trim();
        const ln = document.getElementById('np-last').value.trim();
        const st = document.getElementById('np-status').value;
        const ph = document.getElementById('np-phone').value.trim();
        const pid = 'per_' + Date.now();
        state.data.people.unshift({
          Person_ID: pid,
          First_Name: fn,
          Last_Name: ln,
          Member_Status: st,
          Mobile_Phone: ph,
          Email: ''
        });
        if (state.gasUrl && !state.isSimulated) {
          await callVaultApi('savePerson', { firstName: fn, lastName: ln, memberStatus: st, mobilePhone: ph });
        }
        showToast('Added ' + fn + ' ' + ln + ' (' + st + ') to Vault Directory!');
        ev.target.reset();
        renderMainWorkspace();
      } else if (fid === 'atomic-xfer-form') {
        const fromBank = document.getElementById('xf-from-bank').value;
        const toBank = document.getElementById('xf-to-bank').value;
        const fromFund = document.getElementById('xf-from-fund').value;
        const toFund = document.getElementById('xf-to-fund').value;
        const amt = Math.abs(Number(document.getElementById('xf-amount').value || 0));
        const memo = document.getElementById('xf-memo').value.trim();
        if (amt > 0) {
          state.data.ledger.push(
            {
              Line_ID: 'ln_xf_out_' + Date.now(),
              Bank_Account_ID: fromBank,
              Signed_Cash_Impact: -amt,
              Payee_Description: 'Transfer Out: ' + memo,
              Fund_Code: fromFund
            },
            {
              Line_ID: 'ln_xf_in_' + Date.now(),
              Bank_Account_ID: toBank,
              Signed_Cash_Impact: amt,
              Payee_Description: 'Transfer In: ' + memo,
              Fund_Code: toFund
            }
          );
          if (state.gasUrl && !state.isSimulated) {
            await callVaultApi('recordAtomicTransfer', {
              fromBankId: fromBank,
              toBankId: toBank,
              fromFundCode: fromFund,
              toFundCode: toFund,
              amount: amt,
              memo: memo
            });
          }
          showToast('Posted balanced ' + fmtMoney(amt) + ' transfer ($0.00 Fund Drift maintained)!');
          ev.target.reset();
          renderMainWorkspace();
        }
      } else if (fid === 'add-gift-form') {
        const donor = document.getElementById('gift-donor').value.trim();
        const amt = Number(document.getElementById('gift-amount').value || 0);
        const [fundCode, catCode, catName] = document.getElementById('gift-fund').value.split('|');
        const method = document.getElementById('gift-method').value;
        state.data.contributions.push({
          Contribution_ID: 'cnt_' + Date.now(),
          Month_Key: '2026-11',
          Gift_Date: '2026-11-23',
          Batch_ID: state.selectedBatchId,
          Donor_Name: donor,
          Amount: amt,
          Category_Code: catCode,
          Category_Name: catName,
          Fund_Code: fundCode,
          Payment_Type: method
        });
        if (state.gasUrl && !state.isSimulated) {
          await callVaultApi('addContribution', {
            batchId: state.selectedBatchId,
            donorName: donor,
            amount: amt,
            categoryCode: catCode,
            categoryName: catName,
            fundCode: fundCode,
            paymentType: method
          });
        }
        showToast('Added ' + fmtMoney(amt) + ' gift to batch!');
        renderMainWorkspace();
      } else if (fid === 'new-ap-bill-form') {
        const vendor = document.getElementById('ap-vendor').value.trim();
        const amt = Number(document.getElementById('ap-amount').value || 0);
        const due = document.getElementById('ap-due').value;
        state.data.apBills.push({
          Bill_ID: 'ap_' + Date.now(),
          Vendor_Name: vendor,
          Invoice_Number: 'INV-' + String(Date.now()).slice(-4),
          Due_Date: due,
          Amount: amt,
          Category_Code: '10-5202',
          Fund_Code: '10',
          Pay_From_Account_ID: 'bnk_boa_9284',
          Status: 'Approved'
        });
        if (state.gasUrl && !state.isSimulated) {
          await callVaultApi('createApBill', {
            vendorName: vendor,
            amount: amt,
            dueDate: due,
            photoBase64: state.pendingPhotoBase64,
            photoFilename: state.pendingPhotoName
          });
        }
        state.pendingPhotoBase64 = '';
        state.pendingPhotoName = '';
        showToast('Saved AP Bill (' + vendor + ') to Vault!');
        renderMainWorkspace();
      } else if (fid === 'add-song-form') {
        const title = document.getElementById('song-title').value.trim();
        const dKey = document.getElementById('song-key').value;
        const chart = document.getElementById('song-chordpro').value;
        const sid = 'sng_' + Date.now();
        state.data.songs.push({ Song_ID: sid, Title: title, Default_Key: dKey, BPM: 74, ChordPro_Chart: chart });
        if (state.gasUrl && !state.isSimulated) {
          await callVaultApi('saveSong', { songId: sid, title: title, defaultKey: dKey, chordProChart: chart });
        }
        state.selectedSongId = sid;
        state.selectedKey = dKey;
        state.activeTab = 'worship_stage';
        showToast('Added "' + title + '" to Song Library!');
        renderNavBar(getNavTabsForCurrentSession());
        renderMainWorkspace();
      } else if (fid === 'provision-user-form') {
        const fullName = document.getElementById('prov-fullname').value.trim();
        const username = document.getElementById('prov-username').value.trim();
        const tempPassword = document.getElementById('prov-password').value;
        const role = document.getElementById('prov-role').value;
        const email = document.getElementById('prov-email').value.trim();
        const phone = document.getElementById('prov-phone').value.trim();
        const scopes = Array.from(document.querySelectorAll('input[name="prov_scope"]:checked')).map(c => c.value).join(', ') || 'Sunday Worship';
        const mods = Array.from(document.querySelectorAll('input[name="prov_mod"]:checked')).map(c => c.value).join(',') || 'dashboard';

        if (state.gasUrl && !state.isSimulated) {
          const res = await callVaultApi('createUser', {
            username: username,
            fullName: fullName,
            tempPassword: tempPassword,
            role: role,
            email: email,
            phone: phone,
            ministryScopes: scopes,
            allowedModules: mods
          });
          if (!res.ok) {
            showToast(res.error || 'Could not create user');
            return;
          }
          state.data.users = res.users;
        } else {
          state.data.users.push({
            userId: 'usr_' + Date.now(),
            username: username,
            fullName: fullName,
            email: email,
            phone: phone,
            role: role,
            allowedModules: mods,
            ministryScopes: scopes,
            active: true
          });
        }
        showToast('Provisioned @' + username + ' (' + role + ')!');
        ev.target.reset();
        renderMainWorkspace();
      } else if (fid === 'public-prayer-form') {
        const name = document.getElementById('pray-name').value.trim();
        const prayer = document.getElementById('pray-body').value.trim();
        if (state.gasUrl) {
          await callVaultApi('submitConnectCard', { fullName: name, guestStatus: 'Regular / Prayer Request', prayerRequest: prayer });
        }
        showToast('Thank you! Your prayer request was sent to Pastor Joel.');
        ev.target.reset();
      } else if (fid === 'stripe-give-form') {
        const amt = Number(document.getElementById('stripe-amt').value || 0);
        const fundLbl = document.getElementById('stripe-fund').value;
        if (state.gasUrl) {
          const res = await callVaultApi('createStripeCheckout', { amount: amt, fundLabel: fundLbl });
          if (res.ok && res.checkoutUrl) {
            window.location.href = res.checkoutUrl;
            return;
          }
          showToast(res.error || 'Configure STRIPE_SECRET_KEY in Apps Script ScriptProperties');
        } else {
          showToast('Stripe Checkout ready for ' + fmtMoney(amt) + ' (' + fundLbl + ') — connect STRIPE_SECRET_KEY in ScriptProperties');
        }
      }
    });
  }

  function mergeServerBootstrap(boot) {
    if (boot.vaultLinks) state.data.vaultLinks = boot.vaultLinks;
    if (Array.isArray(boot.users) && boot.users.length) state.data.users = boot.users;
    if (Array.isArray(boot.pilotFeedback)) state.data.pilotFeedback = boot.pilotFeedback;
    if (Array.isArray(boot.people) && boot.people.length) state.data.people = boot.people;
    if (Array.isArray(boot.visitors) && boot.visitors.length) state.data.visitors = boot.visitors;
    if (Array.isArray(boot.events) && boot.events.length) state.data.events = boot.events;
    if (Array.isArray(boot.attendanceSessions) && boot.attendanceSessions.length) state.data.attendanceSessions = boot.attendanceSessions;
    if (Array.isArray(boot.songs) && boot.songs.length) state.data.songs = boot.songs;
    if (Array.isArray(boot.outlines) && boot.outlines.length) state.data.outlines = boot.outlines;
    if (Array.isArray(boot.schedules) && boot.schedules.length) state.data.schedules = boot.schedules;
    if (Array.isArray(boot.givingBatches) && boot.givingBatches.length) state.data.givingBatches = boot.givingBatches;
    if (Array.isArray(boot.contributions) && boot.contributions.length) state.data.contributions = boot.contributions;
    if (Array.isArray(boot.bankAccounts) && boot.bankAccounts.length) state.data.bankAccounts = boot.bankAccounts;
    if (Array.isArray(boot.funds) && boot.funds.length) state.data.funds = boot.funds;
    if (Array.isArray(boot.ledger) && boot.ledger.length) state.data.ledger = boot.ledger;
    if (Array.isArray(boot.apBills) && boot.apBills.length) state.data.apBills = boot.apBills;
    if (Array.isArray(boot.bankFeed)) state.data.bankFeed = boot.bankFeed;
  }

  // Handle URL Query Parameters (?pilot=..., ?api=..., ?view=connect, ?view=worship, ?rsvp=...)
  async function initFromUrlAndSession() {
    const params = new URLSearchParams(window.location.search);
    const apiParam = params.get('api');
    if (apiParam && apiParam.startsWith('https://script.google.com/')) {
      state.gasUrl = apiParam.trim();
      localStorage.setItem(STORAGE_KEYS.GAS_URL, state.gasUrl);
      document.getElementById('gas-url-input').value = state.gasUrl;
    }

    const pilotParam = params.get('pilot');
    if (pilotParam && launchPilotUserByKey(pilotParam)) {
      return;
    }

    const rsvpTok = params.get('rsvp');
    if (rsvpTok) {
      state.mode = 'rsvp';
      state.rsvpToken = rsvpTok;
      state.activeTab = 'rsvp_magic';
      if (state.gasUrl) {
        try {
          const res = await callVaultApi('lookupRsvp', { token: rsvpTok });
          if (res.ok) state.rsvpAssignment = res.assignment;
        } catch (_) {}
      }
      enterShell();
      return;
    }

    const view = params.get('view');
    if (view === 'connect') {
      state.mode = 'public';
      state.activeTab = 'pub_connect';
      if (state.gasUrl) {
        try {
          const pub = await callVaultApi('publicBootstrap', {});
          if (pub.ok) mergeServerBootstrap(pub);
        } catch (_) {}
      }
      enterShell();
      return;
    }
    if (view === 'worship') {
      state.mode = 'worship_public';
      state.activeTab = 'worship_stage';
      enterShell();
      return;
    }

    // Resume saved authenticated session if present
    if (state.sessionToken && state.gasUrl) {
      try {
        const boot = await callVaultApi('bootstrapApp', {});
        if (boot.ok && boot.user) {
          state.user = boot.user;
          state.isSimulated = false;
          mergeServerBootstrap(boot);
          enterShell();
        }
      } catch (_) {}
    }
  }

  // Service Worker Registration
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  bindEvents();
  initFromUrlAndSession();
})();
