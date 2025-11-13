import { Link } from "react-router-dom";
import { Text } from "@/components/atoms/Text";
import { Button } from "@/components/atoms/Button";

export const Home = () => {
  return (
    <div className="container mx-auto h-[calc(100vh-4rem-10px)] lg:h-[calc(100vh-5rem-10px)] flex items-center justify-center">
      <div className="max-w-3xl mx-auto text-center">
        <Text as="h1" className="mb-4">
          Orchestrator
        </Text>
        <Text as="p" className="text-muted-foreground mb-8 text-lg">
          by @sihilelh
        </Text>
        <Text as="p" className="mb-8 text-lg">
          Create and experiment with wave patterns and audio synthesis.
        </Text>
        <div className="flex gap-4 justify-center">
          <Button variant="default" size="lg" asChild>
            <Link to="/playground">Get Started</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/how-to-use">Learn More</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
