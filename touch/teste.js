/* ===========================
   How It Works Section
   =========================== */
   .how-it-works {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    background-color: #ffffff;
    padding: 3rem 2rem;
    gap: 2rem;
    margin-top: 3rem;
    border-radius: 10px;
  }
  
  .how-it-works-text {
    flex: 1 1 350px;
    max-width: 550px;
  }
  
  /* Heading and intro paragraph */
  .how-it-works-text h2 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    color: #002f5c;
  }
  
  .how-it-works-text > p {
    font-size: 1rem;
    margin-bottom: 1.5rem;
    color: #333333;
    line-height: 1.6;
  }
  
  /* Numbered list of steps */
  .how-it-works-steps {
    list-style-type: decimal;
    padding-left: 1.5rem;        /* indent the numbers */
    margin-bottom: 1.5rem;
  }
  
  .how-it-works-steps li {
    margin-bottom: 1rem;         /* vertical space between steps */
    font-size: 1rem;
    line-height: 1.6;
    color: #333333;
  }
  
  /* Emphasize the bold step titles */
  .how-it-works-steps li strong {
    color: #002f5c;
  }
  
  /* Platform fee note styling */
  .platform-fee {
    font-size: 0.95rem;
    color: #004b91;
    margin-bottom: 1.5rem;
    font-style: italic;
  }
  
  /* “Try It Now” button */
  .cta-outline {
    padding: 12px 24px;
    border: 2px solid #004b91;
    color: #004b91;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    display: inline-block;
    transition: background-color 0.3s ease, color 0.3s ease;
  }
  
  .cta-outline:hover {
    background-color: #004b91;
    color: #ffffff;
  }
  
  /* Right-side container */
  .how-it-works-extra {
    flex: 1 1 300px;
    max-width: 600px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .how-it-works-tagline {
    font-size: 1rem;
    color: #005b9f;
    font-style: italic;
    margin-bottom: 1rem;
  }
  
  /* Illustration image */
  .how-it-works-image img {
    width: 100%;
    max-width: 600px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  /* ===========================
     Responsive Adjustments (≤768px)
     =========================== */
  @media (max-width: 768px) {
    .how-it-works {
      flex-direction: column;
      text-align: center;
    }
  
    .how-it-works-text,
    .how-it-works-extra {
      max-width: 100%;
      margin: 0 auto;
    }
  
    .how-it-works-steps {
      padding-left: 1rem;       /* reduce indent on mobile */
    }
  }
  