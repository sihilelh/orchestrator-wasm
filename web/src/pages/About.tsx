import { Text } from "@/components/atoms/Text";

export const About = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Text as="h1" className="mb-4">
        About
      </Text>
      <Text as="p" className="text-muted-foreground mb-4">
        Orchestrator by @sihilelh
      </Text>
      <Text as="p" className="text-muted-foreground">
        Configure and customize your Orchestrator settings here.
      </Text>
    </div>
  );
};

