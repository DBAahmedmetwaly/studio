"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getFinancialAnalysis } from "./actions";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          جارٍ التحليل...
        </>
      ) : (
        <>
          <Wand2 className="ml-2 h-4 w-4" />
          تحليل القيود
        </>
      )}
    </Button>
  );
}

export default function AiAnalysisClient() {
  const initialState = { message: null, suggestions: null, issues: [] };
  const [state, dispatch] = useFormState(getFinancialAnalysis, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message && state.message !== "Analysis successful." && !state.issues?.length) {
      toast({
        variant: "destructive",
        title: "خطأ في التحليل",
        description: state.message,
      });
    }
  }, [state, toast]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <form action={dispatch}>
          <CardHeader>
            <CardTitle>تحليل قيود اليومية</CardTitle>
            <CardDescription>
              الصق قيود اليومية الخاصة بك أدناه. سيقدم الذكاء الاصطناعي اقتراحات قابلة للتنفيذ لتحسين الوضع المالي.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full gap-2">
              <Label htmlFor="journalEntries">قيود اليومية</Label>
              <Textarea
                id="journalEntries"
                name="journalEntries"
                placeholder="مثال: 2023-10-01، مدين نقدية 1000، دائن إيرادات مبيعات 1000؛ 2023-10-02، مدين تكلفة البضاعة المباعة 500، دائن مخزون 500..."
                className="min-h-48"
                required
              />
              {state.issues && state.issues.length > 0 && (
                <div className="text-sm font-medium text-destructive">
                  {state.issues.join(", ")}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>اقتراحات مدعومة بالذكاء الاصطناعي</CardTitle>
          <CardDescription>
            ستظهر هنا رؤى قابلة للتنفيذ بناءً على بياناتك المالية.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          {useFormStatus().pending ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
                <p>الذكاء الاصطناعي يحلل بياناتك...</p>
              </div>
            </div>
          ) : state.suggestions ? (
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle>اكتمل التحليل المالي!</AlertTitle>
              <AlertDescription>
                <div
                  className="prose prose-sm dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: state.suggestions.replace(/\n/g, "<br />"),
                  }}
                />
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50">
              <div className="text-center text-muted-foreground">
                <Wand2 className="mx-auto mb-2 h-8 w-8" />
                <p>سيتم عرض تحليلك هنا.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
