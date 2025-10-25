'use client';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useWallet } from '@/hooks/useWallet';
import { api } from '@/lib/api';
import { TaskType } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SubmitTaskPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isConnected } = useWallet();
  
  const taskId = params.taskId as string;
  const [formData, setFormData] = useState({ text: '', imageFile: null as File | null });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: taskData, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => api.tasks.getById(taskId),
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => api.submissions.submit(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      
      const submissionId = response.data.submissionId;
      router.push(`/submissions/${submissionId}`);
    },
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || 'Submission failed');
    },
  });

  const task = taskData?.data;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, image: 'File size must be less than 5MB' });
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors({ ...errors, image: 'Only JPG, PNG, WebP images are allowed' });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setFormData({ ...formData, imageFile: file });
    setErrors({ ...errors, image: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    // Validation
    const newErrors: Record<string, string> = {};

    if (task?.taskType === TaskType.TEXT_VERIFICATION && !formData.text.trim()) {
      newErrors.text = 'Text is required';
    }

    if (task?.taskType === TaskType.IMAGE_LABELING && !formData.imageFile) {
      newErrors.image = 'Image is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare submission data
    const submissionData: any = {};

    if (task?.taskType === TaskType.TEXT_VERIFICATION) {
      submissionData.text = formData.text;
    }

    if (task?.taskType === TaskType.IMAGE_LABELING) {
      // In production, upload to cloud storage (S3, Cloudinary, etc.)
      submissionData.imageUrls = ['https://placeholder.com/image.jpg'];
      submissionData.metadata = { fileName: formData.imageFile?.name };
    }

    // Submit
    await submitMutation.mutateAsync({
      taskId,
      submissionData,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!task) {
    return <div className="text-center py-12">Task not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Task Info */}
      <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h2>
        <p className="text-gray-700 mb-4">{task.description}</p>
        <div className="text-sm text-gray-600">
          Payment: <span className="font-semibold text-green-600">${task.paymentAmount}</span>
        </div>
      </div>

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Submit Your Work</h3>

        {/* Text Verification */}
        {task.taskType === TaskType.TEXT_VERIFICATION && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Response *
            </label>
            <textarea
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              rows={8}
              placeholder="Enter your response here..."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.text ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.text && <p className="mt-2 text-sm text-red-600">{errors.text}</p>}
            <p className="mt-2 text-sm text-gray-500">{formData.text.length} characters</p>
          </div>
        )}

        {/* Image Labeling */}
        {task.taskType === TaskType.IMAGE_LABELING && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload Image *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-96 mx-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData({ ...formData, imageFile: null });
                    }}
                    className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Choose Image
                  </label>
                  <p className="mt-2 text-sm text-gray-500">PNG, JPG, WebP up to 5MB</p>
                </div>
              )}
            </div>
            {errors.image && <p className="mt-2 text-sm text-red-600">{errors.image}</p>}
          </div>
        )}

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            ⚠️ Your submission will be verified by AI. Please ensure it meets all requirements to avoid rejection.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitMutation.isPending || !isConnected}
          className="w-full py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
        >
          {submitMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              Submitting...
            </span>
          ) : !isConnected ? (
            'Connect Wallet to Submit'
          ) : (
            'Submit Task'
          )}
        </button>
      </form>
    </div>
  );
}
