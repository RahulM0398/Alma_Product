// ─────────────────────────────────────────────────────
// Alma Pre-Flight — Sandbox Preset Templates
// Realistic H-1B filing error scenarios for instant demo.
// ─────────────────────────────────────────────────────

import type { PetitionInputs } from "./rulesEngine";

export interface Preset {
  id: string;
  label: string;
  description: string;
  severity: "critical" | "warning" | "clean";
  inputs: PetitionInputs;
}

export const PRESETS: Preset[] = [
  {
    id: "wage-level-mismatch",
    label: "Wage Level I + Senior Duties",
    description: "LCA designates Level I entry wage, but the support letter describes lead architect responsibilities.",
    severity: "critical",
    inputs: {
      formI129: `Form I-129 Petition for Nonimmigrant Worker
Employer: TechNova Solutions Inc.
Beneficiary: Arjun Mehta
Job Title: Software Developer
SOC Code: 15-1256
Classification: H-1B
Worksite: San Jose, CA 95134
Period of Employment: October 1, 2026 – September 30, 2029
Proposed Wage: $85,000/year
The beneficiary will perform duties as a Software Developer at the employer's principal place of business.`,
      lcaText: `ETA Form 9035 — Labor Condition Application
Employer: TechNova Solutions Inc.
Job Title: Software Developer
SOC Code: 15-1256
SOC Title: Software Developers and Software Quality Assurance Analysts
Wage Level: Level I
Prevailing Wage: $82,034/year
Offered Wage: $85,000/year
Worksite: San Jose, CA 95134
Period of Employment: 10/01/2026 – 09/30/2029
Full-time position: Yes`,
      supportLetter: `TechNova Solutions Inc.
Re: H-1B Petition for Arjun Mehta — Senior Lead Software Architect

Dear USCIS Officer,

We are filing this petition for Mr. Arjun Mehta to serve as a Senior Lead Software Architect at our San Jose office. This position requires a minimum of 7 years of progressive experience in software architecture and systems design.

Job Title: Senior Lead Software Architect

Duties and Responsibilities:
1. Lead and architect the company's core distributed systems platform serving 2M+ daily active users.
2. Manage a team of 8 engineers, conducting code reviews, sprint planning, and performance evaluations.
3. Formulate strategy for migrating legacy monolithic applications to microservice architectures.
4. Independently design and implement real-time data processing pipelines handling 500K events/second.
5. Oversee deployment infrastructure and make unsupervised decisions on production system changes.
6. Develop software applications for internal tooling.
7. Mentor junior developers on best practices in distributed computing.

Education Requirement: Minimum Bachelor's degree in Computer Science or closely related field.

Sincerely,
Priya Sharma, VP of Engineering`,
      credentials: `Beneficiary: Arjun Mehta
Education: Master of Science in Computer Science, Stanford University, 2018
Bachelor of Technology in Computer Science and Engineering, IIT Bombay, 2016

Professional Experience: 8 years of software engineering experience
- Principal Engineer, DataStream Corp (2022–2026): Led platform team of 12 engineers.
- Senior Software Engineer, CloudBase Inc (2019–2022): Architected event-driven systems.
- Software Engineer, StartupXYZ (2018–2019): Developed backend APIs.

Certifications: AWS Solutions Architect Professional, Google Cloud Professional Data Engineer`,
    },
  },
  {
    id: "degree-mismatch",
    label: "Degree Field Mismatch",
    description: "Support letter requires Computer Science, but beneficiary holds a degree in Electrical Engineering.",
    severity: "critical",
    inputs: {
      formI129: `Form I-129 Petition for Nonimmigrant Worker
Employer: Meridian Data Corp.
Beneficiary: Li Wei Chen
Job Title: Data Analyst
SOC Code: 15-2051
Classification: H-1B
Worksite: Austin, TX 78701
Period of Employment: October 1, 2026 – September 30, 2029
Proposed Wage: $95,000/year`,
      lcaText: `ETA Form 9035 — Labor Condition Application
Employer: Meridian Data Corp.
Job Title: Data Analyst
SOC Code: 15-2051
Wage Level: Level II
Prevailing Wage: $88,400/year
Offered Wage: $95,000/year
Worksite: Austin, TX 78701
Full-time: Yes`,
      supportLetter: `Meridian Data Corp.
Re: H-1B Petition for Li Wei Chen — Data Analyst

Dear USCIS Officer,

We are petitioning for Mr. Li Wei Chen for the position of Data Analyst. This role requires a minimum Bachelor's degree in Computer Science.

Job Title: Data Analyst

Duties:
1. Build predictive models using Python, TensorFlow, and scikit-learn.
2. Design ETL pipelines using Apache Spark and Airflow.
3. Work with the team to deliver analytical dashboards.
4. Use databases for complex query optimization.
5. Test software modules for data integrity.
6. Create reports for executive stakeholders.

Minimum Requirements: Bachelor's degree in Computer Science. 3 years of relevant experience.

Sincerely,
James Rodriguez, Director of Analytics`,
      credentials: `Beneficiary: Li Wei Chen
Education: Bachelor of Science in Electrical Engineering, University of Texas at Austin, 2022

Professional Experience: 4 years
- Data Analyst, Meridian Data Corp (2023–present): Building ML models.
- Junior Analyst, DataPulse LLC (2022–2023): SQL reporting and dashboards.

No credential evaluation on file.`,
    },
  },
  {
    id: "title-drift",
    label: "Job Title Drift Across Documents",
    description: "Each document uses a different job title, creating cross-document inconsistency.",
    severity: "critical",
    inputs: {
      formI129: `Form I-129 Petition for Nonimmigrant Worker
Employer: Orion Systems LLC
Beneficiary: Maria Santos
Job Title: Computer Systems Analyst
SOC Code: 15-1211
Classification: H-1B
Worksite: Chicago, IL 60601
Period of Employment: October 1, 2026 – September 30, 2029
Proposed Wage: $105,000/year`,
      lcaText: `ETA Form 9035 — Labor Condition Application
Employer: Orion Systems LLC
Job Title: Systems Analyst
SOC Code: 15-1211
Wage Level: Level II
Prevailing Wage: $96,200/year
Offered Wage: $105,000/year
Worksite: Chicago, IL 60601`,
      supportLetter: `Orion Systems LLC
Re: H-1B Petition for Maria Santos — Senior Software Engineer

Dear USCIS Officer,

We are filing this petition for Ms. Maria Santos for the position of Senior Software Engineer.

Job Title: Senior Software Engineer

Duties:
1. Design and implement scalable cloud-native applications using AWS and Kubernetes.
2. Collaborate with product and design teams in Agile sprint ceremonies.
3. Conduct technical architecture reviews for new feature proposals.
4. Optimize database query performance across PostgreSQL and Redis clusters.

Requirements: Bachelor's degree in Computer Science or related field. Minimum 3 years experience.

Sincerely,
David Kim, CTO`,
      credentials: `Beneficiary: Maria Santos
Education: Master of Science in Computer Science, University of Illinois Urbana-Champaign, 2021
Bachelor of Science in Computer Science, Universidad de Buenos Aires, 2019

Professional Experience: 5 years
- Software Engineer, Orion Systems LLC (2022–present)
- Junior Developer, TechStart Buenos Aires (2019–2021)`,
    },
  },
  {
    id: "clean-filing",
    label: "✓ Clean Filing Package",
    description: "All documents are consistent. No flags expected.",
    severity: "clean",
    inputs: {
      formI129: `Form I-129 Petition for Nonimmigrant Worker
Employer: Cascade Analytics Inc.
Beneficiary: Priya Nair
Job Title: Software Developer
SOC Code: 15-1252
Classification: H-1B
Worksite: Seattle, WA 98101
Period of Employment: October 1, 2026 – September 30, 2029
Proposed Wage: $120,000/year`,
      lcaText: `ETA Form 9035 — Labor Condition Application
Employer: Cascade Analytics Inc.
Job Title: Software Developer
SOC Code: 15-1252
Wage Level: Level II
Prevailing Wage: $108,500/year
Offered Wage: $120,000/year
Worksite: Seattle, WA 98101
Full-time: Yes`,
      supportLetter: `Cascade Analytics Inc.
Re: H-1B Petition for Priya Nair — Software Developer

Dear USCIS Officer,

We petition for Ms. Priya Nair for the role of Software Developer.

Job Title: Software Developer

Duties:
1. Engineer distributed microservice architectures using event-driven patterns in Java and Kubernetes.
2. Implement automated regression testing frameworks integrated with CI/CD pipelines.
3. Design normalized relational schemas and optimize query execution plans in PostgreSQL.
4. Perform root-cause analysis on production incidents through systematic profiling.

Requirements: Bachelor's degree in Computer Science or Software Engineering. 2 years experience.

Sincerely,
Sarah Lin, VP of Engineering`,
      credentials: `Beneficiary: Priya Nair
Education: Bachelor of Science in Computer Science, University of Washington, 2023

Professional Experience: 3 years
- Software Developer, Cascade Analytics Inc. (2024–present)
- Software Engineering Intern, Amazon (Summer 2023)
- Research Assistant, UW CSE Department (2022–2023)`,
    },
  },
  {
    id: "uscis-rfe-specialty-occupation",
    label: "USCIS Specialty Occupation RFE",
    description: "Ingests a live USCIS RFE letter challenging both software complexity and Level I wage rate.",
    severity: "critical",
    inputs: {
      formI129: `Form I-129 Petition for Nonimmigrant Worker
Employer: TechNova Solutions Inc.
Beneficiary: Arjun Mehta
Job Title: Software Developer
SOC Code: 15-1256
Classification: H-1B
Worksite: San Jose, CA 95134
Period of Employment: October 1, 2026 – September 30, 2029
Proposed Wage: $85,000/year
The beneficiary will perform duties as a Software Developer at the employer's principal place of business.`,
      lcaText: `ETA Form 9035 — Labor Condition Application
Employer: TechNova Solutions Inc.
Job Title: Software Developer
SOC Code: 15-1256
SOC Title: Software Developers and Software Quality Assurance Analysts
Wage Level: Level I
Prevailing Wage: $82,034/year
Offered Wage: $85,000/year
Worksite: San Jose, CA 95134
Period of Employment: 10/01/2026 – 09/30/2029
Full-time position: Yes`,
      supportLetter: `TechNova Solutions Inc.
Re: H-1B Petition for Arjun Mehta — Senior Lead Software Architect

Dear USCIS Officer,

We are filing this petition for Mr. Arjun Mehta to serve as a Senior Lead Software Architect at our San Jose office. This position requires a minimum of 7 years of progressive experience in software architecture and systems design.

Job Title: Senior Lead Software Architect

Duties and Responsibilities:
1. Lead and architect the company's core distributed systems platform serving 2M+ daily active users.
2. Manage a team of 8 engineers, conducting code reviews, sprint planning, and performance evaluations.
3. Formulate strategy for migrating legacy monolithic applications to microservice architectures.
4. Independently design and implement real-time data processing pipelines handling 500K events/second.
5. Oversee deployment infrastructure and make unsupervised decisions on production system changes.
6. Develop software applications for internal tooling.
7. Mentor junior developers on best practices in distributed computing.

Education Requirement: Minimum Bachelor's degree in Computer Science or closely related field.

Sincerely,
Priya Sharma, VP of Engineering`,
      credentials: `Beneficiary: Arjun Mehta
Education: Master of Science in Computer Science, Stanford University, 2018
Bachelor of Technology in Computer Science and Engineering, IIT Bombay, 2016

Professional Experience: 8 years of software engineering experience
- Principal Engineer, DataStream Corp (2022–2026): Led platform team of 12 engineers.
- Senior Software Engineer, CloudBase Inc (2019–2022): Architected event-driven systems.
- Software Engineer, StartupXYZ (2018–2019): Developed backend APIs.

Certifications: AWS Solutions Architect Professional, Google Cloud Professional Data Engineer`,
      rfeLetter: `DEPARTMENT OF HOMELAND SECURITY
U.S. Citizenship and Immigration Services
Form I-129, Petition for a Nonimmigrant Worker

RE: Form I-129 H-1B Petition for Arjun Mehta
Proposed Position: Software Developer
Petitioner: TechNova Solutions Inc.

REQUEST FOR EVIDENCE

The petitioner is seeking classification of the beneficiary as an H-1B nonimmigrant worker in a specialty occupation. Based on the initial review of the petition, the evidence submitted is insufficient to establish eligibility.

1. Specialty Occupation Challenge
USCIS is unable to determine whether the proposed position qualifies as a specialty occupation. The job duties provided in the Employer Support Letter appear to be generic software tasks (e.g. "develop software applications", "mentor junior developers") and fail to demonstrate that the position requires a highly specialized body of knowledge. Provide additional, detailed explanations of the duties, including specific tools and complexity levels, to establish that the role meets specialty occupation standards.

2. Wage Level Challenge
The Labor Condition Application (LCA) submitted designates the position as a Level I (entry level) prevailing wage rate. However, the Employer Support Letter describes responsibilities including "lead and architect core distributed systems," "manage a team of 8 engineers," and "make unsupervised decisions." These responsibilities appear to correspond to a senior or supervisory role, which is inconsistent with a Level I entry wage. Reconcile this discrepancy.`,
    },
  },
];
