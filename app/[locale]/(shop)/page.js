import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getServerSession } from "next-auth/next";
import { serverGetProductBundle, serverGetHome } from "@/lib/api/server";
import BannerWithClient from "@/components/shop/BannerWithClient";
import SaleBanner from "@/components/common/SaleBanner";
import ScrollingBanner from "@/components/common/ScrollingBanner";
import CategoriesHome from "@/components/shop/CategoriesHome";
export default async function HomePage({ params }) {
      const { locale } = await params;
      const dictionary = await getDictionary(locale)
  const session = await getServerSession(authOptions);
console.log(session)
  const results = await Promise.allSettled([
    serverGetHome(locale),
    serverGetProductBundle(locale)
  ]);
  const [home, productBundle] = results;
  console.log(home)
  return (
    <>
    <SaleBanner />
      <BannerWithClient banners={home.status === "fulfilled" ? home.value.banners : []}/>
      <ScrollingBanner/>
      <CategoriesHome categories={home.status==='fulfilled' ? home.value.categories : []}/>

    </>
  )
}