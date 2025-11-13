import { Text } from "@/components/atoms/Text";

export const HowToUse = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Text as="h1" className="mb-4">
        How to use
      </Text>
      <Text as="p" className="text-muted-foreground mb-4">
        Learn how to use Orchestrator to create amazing wave experiments.
      </Text>
      <div className="space-y-4">
        <Text as="h3" className="mt-6">
          Getting Started
        </Text>
        <Text as="p" className="text-muted-foreground">
          Instructions and tutorials will be added here.
        </Text>
      </div>
    </div>
  );
};

