import BrunoZarathPlatform from "@/components/bruno-zarath/BrunoZarathPlatform";
import { ContentProvider } from "@/components/bruno-zarath/content-context";

export default function Home() {
  return (
    <ContentProvider>
      <BrunoZarathPlatform />
    </ContentProvider>
  );
}
