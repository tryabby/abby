import Link from "next/link";
import IgusLogo from "../../public/img/companies/igus.svg";
import DynabaseLogo from "../../public/img/companies/dynabase.svg";
import RBTXLogo from "../../public/img/companies/rbtx.svg";
import MavenoidLogo from "../../public/img/companies/mavenoid.svg";
import Image from "next/image";

const COMPANIES = [
  {
    name: "igus",
    logo: IgusLogo,
    companyUrl: "https://www.igus.com/",
  },
  {
    name: "RBTX",
    logo: RBTXLogo,
    companyUrl: "https://rbtx.com/",
  },
  {
    name: "Dynabase",
    logo: DynabaseLogo,
    companyUrl: "https://dynabase.de/",
  },
  {
    name: "Mavenoid",
    logo: MavenoidLogo,
    companyUrl: "https://mavenoid.com/",
  },
] satisfies Array<{
  logo: React.ReactNode;
  name: string;
  companyUrl: string;
}>;

export function UsedBy() {
  return (
    <div className="container px-6 md:px-16">
      <h1 className="text-center text-4xl font-bold">Used by engineers at:</h1>

      <div className="mx-auto mt-24 flex items-center justify-between">
        {COMPANIES.map((company, index) => (
          <Link
            href={company.companyUrl}
            className={
              "aspect-video h-20 cursor-pointer opacity-50 grayscale transition-all duration-300 ease-in-out hover:opacity-100 hover:grayscale-0"
            }
          >
            <Image
              src={company.logo}
              alt={company.name}
              className="h-full w-full object-contain"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
