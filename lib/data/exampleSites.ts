export type ExampleSitePair = {
  /** Stable key for “last run” tracking */
  id: string;
  label: string;
  currentUrl: string;
  /** Lovable / staging URL; omit until you have a redesign to compare */
  newUrl?: string;
};

export const EXAMPLE_SITE_PAIRS: ExampleSitePair[] = [
  {
    id: "auckland-electrical-services",
    label: "Auckland Electrical Services",
    currentUrl: "https://www.aucklandelectrical.co.nz/",
  },
  {
    id: "ak-electrical",
    label: "AK Electrical",
    currentUrl: "https://akelectrical.co.nz/",
    newUrl: "https://akelectrical.lovable.app",
  },
  {
    id: "advanced-electrical-services",
    label: "Advanced Electrical Services",
    currentUrl: "https://advancedelectricalservices.co.nz/",
  },
  {
    id: "sparkyg",
    label: "Sparky G",
    currentUrl: "https://www.sparkyg.co.nz/",
    newUrl: "https://sparkyg.lovable.app",
  },
  {
    id: "fixed-electrical",
    label: "FIXED Electrical",
    currentUrl: "https://www.fixedelectrical.co.nz/",
    newUrl: "https://fixedelectrical.lovable.app",
  },
  {
    id: "smartcity-electrical",
    label: "Smartcity Electrical",
    currentUrl: "https://smartcityelectrical.co.nz/",
    newUrl: "https://smartcityelectric.lovable.app",
  },
  {
    id: "eteck-electrical",
    label: "Eteck Electrical",
    currentUrl: "https://eteckelectrical.co.nz/",
    newUrl: "https://eteckelectrical.lovable.app",
  },
  {
    id: "wisdom-electrical",
    label: "Wisdom Electrical",
    currentUrl: "https://www.wisdomelectrical.co.nz/",
    newUrl: "https://wisdomelectric.lovable.app/",
  },
  {
    id: "jde-electrician-auckland",
    label: "JDE Electrician Auckland",
    currentUrl: "https://www.jde.co.nz/",
    newUrl: "https://joshdavyelectric.lovable.app",
  },
  {
    id: "viper-electrical",
    label: "Viper Electrical",
    currentUrl: "https://www.viperelectrical.co.nz/",
    newUrl: "https://vipereletrical.lovable.app",
  },
  {
    id: "hall-electrical",
    label: "Hall Electrical",
    currentUrl: "https://www.hallelectrical.co.nz/",
    newUrl: "https://hallelectric.lovable.app",
  },
  {
    id: "hines-electrical",
    label: "Hines Electrical",
    currentUrl: "https://www.hines.co.nz/",
    newUrl: "https://hineselectrical.lovable.app",
  },
  {
    id: "allbases",
    label: "All Bases Electrical",
    currentUrl: "https://www.allbaseselectrical.co.nz/",
    newUrl: "https://allbaseselectrical.lovable.app",
  },
  {
    id: "shore-electrical",
    label: "Shore Electrical",
    currentUrl: "https://www.shoreelectrical.co.nz/",
    newUrl: "https://shoreelectric.lovable.app",
  },
  {
    id: "tahi",
    label: "Tahi Electrical",
    currentUrl: "https://www.tahielectrical.co.nz/",
    newUrl: "https://tahielectrical.lovable.app",
  },
  {
    id: "kc-electrics",
    label: "KC Electrics",
    currentUrl: "https://kcelectrics.co.nz/",
    newUrl: "https://keelectrics.lovable.app/",
  },
  {
    id: "volts-electric",
    label: "Volts Electric",
    currentUrl: "https://www.voltselectric.co.nz/",
    newUrl: "https://voltselectric.lovable.app",
  },
  {
    id: "sullivan-plumbing",
    label: "Sullivan Plumbing",
    currentUrl: "https://www.sullivanplumbing.co.nz/",
    newUrl: "https://sullivanplumbing.lovable.app/",
  },
  {
    id: "margaritas-cleaning-office-auckland",
    label: "Margarita's Cleaning — office cleaning Auckland",
    currentUrl:
      "https://margaritascleaning.co.nz/office-cleaning-services-auckland/",
    newUrl: "https://margaritascleaning.lovable.app",
  },
  {
    id: "ak-electrical-refined",
    label: "AK Electrical (Refined Studio Recreation)",
    currentUrl: "https://akelectrical.co.nz/",
  },
  {
    id: "slipper-electrical",
    label: "Slipper Electrical",
    currentUrl: "https://slipperelectrical.co.nz/",
    newUrl: "https://slipperelectrical.lovable.app",
  },
  {
    id: "central-clean",
    label: "Central Clean",
    currentUrl: "https://www.centralclean.co.nz/",
    newUrl: "https://centralclean.lovable.app",
  },
  {
    id: "supercity-cleaning",
    label: "Super City Cleaning",
    currentUrl: "https://supercitycleaning.co.nz/home/",
    newUrl: "https://supercitycleaning.lovable.app",
  },
  {
    id: "icc-cleaning",
    label: "ICC Cleaning",
    currentUrl: "https://icc-cleaning.co.nz/",
    newUrl: "https://icc-cleaning.lovable.app",
  },
  {
    id: "hispec-plumbing",
    label: "Hi Spec Plumbing",
    currentUrl: "https://www.hispecplumbing.co.nz/",
    newUrl: "https://hispecplumbing.lovable.app/",
  },
];
