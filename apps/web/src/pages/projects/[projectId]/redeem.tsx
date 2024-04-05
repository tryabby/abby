import { Button } from "components/ui/button";
import { DashboardHeader } from "components/DashboardHeader";
import { Layout } from "components/Layout";
import { Input } from "components/ui/input";
import { useProjectId } from "lib/hooks/useProjectId";
import { cn } from "lib/utils";
import { useRouter } from "next/router";
import { NextPageWithLayout } from "pages/_app";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { trpc } from "utils/trpc";

const CodeRedemptionPage: NextPageWithLayout = () => {
  const projectId = useProjectId();
  const router = useRouter();

  const { data: project } = trpc.project.getProjectData.useQuery({ projectId });

  const { register, handleSubmit, formState } = useForm<{
    code: string;
  }>();
  const redeemCodeMutation = trpc.coupons.redeemCode.useMutation();

  const onSubmit = handleSubmit(async (values) => {
    let toastId = toast.loading("Redeeming...");
    try {
      await redeemCodeMutation.mutateAsync({
        code: values.code,
        projectId,
      });
      toast.success("Code redeemed!", { id: toastId });
      router.push(`/projects/${projectId}/settings`);
    } catch (e) {
      toast.error("Invalid Code", { id: toastId });
    }
  });

  return (
    <div>
      <h2 className="text-2xl font-bold">
        Redeem your Code for {project?.project.name}
      </h2>
      <form onSubmit={onSubmit} className="max-w-md space-y-3">
        <label htmlFor="code" className="flex flex-col space-y-2">
          Code
          <Input
            {...register("code", { required: true })}
            className={cn(formState.errors.code && "border-red-500")}
          />
          {formState.errors.code && (
            <span className="text-red-500">This field is required</span>
          )}
        </label>

        <Button type="submit">Redeem</Button>
      </form>
    </div>
  );
};

CodeRedemptionPage.getLayout = (page) => {
  return (
    <Layout>
      <DashboardHeader title="Redeem your Code" />
      {page}
    </Layout>
  );
};

export default CodeRedemptionPage;
