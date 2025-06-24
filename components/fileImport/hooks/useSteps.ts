// fileImport/useSteps.ts
import { useState } from "react";
import { Step } from "../types";

export function useSteps(
  initialSteps: Omit<Step, "isActive" | "isCompleted">[]
) {
  const [currentStep, setCurrentStep] = useState<number>(1);

  const steps: Step[] = initialSteps.map((step) => ({
    ...step,
    isActive: step.number === currentStep,
    isCompleted: step.number < currentStep,
  }));

  const goToStep = (stepNum: number) => {
    if (stepNum >= 1 && stepNum <= initialSteps.length) {
      setCurrentStep(stepNum);
    }
  };

  const goToNextStep = () => {
    goToStep(currentStep + 1);
  };

  const goToPreviousStep = () => {
    goToStep(currentStep - 1);
  };

  return {
    steps,
    currentStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
  };
}
