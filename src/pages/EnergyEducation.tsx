import { useMemo, useState } from "react";
import { Check, X, RotateCcw, GraduationCap, ArrowRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSeo } from "@/hooks/use-seo";
import { quizData, type ModuleData, type Question } from "@/lib/energy-education";
import { cn } from "@/lib/utils";

const typeLabel: Record<Question["type"], string> = {
  pre: "Pre-check",
  post: "Applied",
};

const QuestionBlock = ({
  question,
  index,
  answer,
  onAnswer,
}: {
  question: Question;
  index: number;
  answer: number | undefined;
  onAnswer: (choice: number) => void;
}) => {
  const answered = answer !== undefined;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="font-semibold text-foreground leading-snug">
          {index + 1}. {question.questionText}
        </h3>
        <Badge variant="secondary" className="shrink-0">
          {typeLabel[question.type]}
        </Badge>
      </div>

      <div className="space-y-2">
        {question.options.map((option, i) => {
          const isCorrect = i === question.correctAnswer;
          const isChosen = answer === i;
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => onAnswer(i)}
              className={cn(
                "w-full text-left flex items-start gap-3 rounded-md border p-3 text-sm transition-colors",
                !answered && "hover:border-primary/50 hover:bg-accent/40",
                answered && isCorrect && "border-primary bg-primary/10",
                answered && isChosen && !isCorrect && "border-destructive bg-destructive/10",
                answered && !isCorrect && !isChosen && "opacity-60",
              )}
            >
              <span className="mt-0.5 shrink-0">
                {answered && isCorrect ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : answered && isChosen ? (
                  <X className="h-4 w-4 text-destructive" />
                ) : (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px] text-muted-foreground">
                    {String.fromCharCode(65 + i)}
                  </span>
                )}
              </span>
              <span className="text-foreground">{option}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <p className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {answer === question.correctAnswer ? "Correct. " : "Not quite. "}
          </span>
          {question.explanation}
        </p>
      )}
    </div>
  );
};

const EnergyEducation = () => {
  useSeo({
    title: "Energy Education Quiz",
    description:
      "Test your knowledge of Austin Energy finances, generation economics, Austin Water, mobility funding, and demand-side management.",
  });

  const [moduleIndex, setModuleIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const activeModule: ModuleData = quizData[moduleIndex];
  const totalQuestions = useMemo(
    () => quizData.reduce((sum, m) => sum + m.questions.length, 0),
    [],
  );
  const answeredCount = Object.keys(answers).length;
  const correctCount = useMemo(
    () =>
      quizData
        .flatMap((m) => m.questions)
        .filter((q) => answers[q.id] === q.correctAnswer).length,
    [answers],
  );

  const moduleComplete = activeModule.questions.every((q) => answers[q.id] !== undefined);
  const isLastModule = moduleIndex === quizData.length - 1;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Energy Education"
        subtitle="A short, self-paced quiz on how Austin's utilities are financed and how energy decisions get made. Answer a question to see the explanation."
      />

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GraduationCap className="h-4 w-4 text-primary" />
                {answeredCount} of {totalQuestions} questions answered
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-foreground">
                  {correctCount} correct
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAnswers({})}
                  disabled={answeredCount === 0}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
            <Progress value={(answeredCount / totalQuestions) * 100} />
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          {quizData.map((m, i) => {
            const done = m.questions.every((q) => answers[q.id] !== undefined);
            return (
              <Button
                key={m.id}
                variant={i === moduleIndex ? "default" : "outline"}
                size="sm"
                onClick={() => setModuleIndex(i)}
              >
                Module {m.id}
                {done && <Check className="ml-2 h-3.5 w-3.5" />}
              </Button>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{activeModule.title}</CardTitle>
            <p className="text-muted-foreground">{activeModule.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeModule.questions.map((q, i) => (
              <QuestionBlock
                key={q.id}
                question={q}
                index={i}
                answer={answers[q.id]}
                onAnswer={(choice) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: choice }))
                }
              />
            ))}

            {moduleComplete && !isLastModule && (
              <div className="flex justify-end pt-2">
                <Button onClick={() => setModuleIndex((i) => i + 1)}>
                  Next module
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {moduleComplete && isLastModule && (
              <p className="pt-2 text-sm text-muted-foreground">
                That's every module. You answered {correctCount} of {totalQuestions}{" "}
                correctly.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnergyEducation;
