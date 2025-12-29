import { Link, useSearchParams } from "react-router-dom";

function PaymentFailure() {
  const [params] = useSearchParams();
  const merchantOrderId = params.get("merchantOrderId");

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-md border border-red-100 p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8 text-red-600"
          >
            <path
              fillRule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm6.97-3.53a.75.75 0 1 0-1.06 1.06L10.94 12l-2.78 2.47a.75.75 0 1 0 1.06 1.06L12 13.06l2.47 2.78a.75.75 0 1 0 1.06-1.06L13.06 12l2.47-2.47a.75.75 0 1 0-1.06-1.06L12 10.94 9.53 8.47Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Failed</h1>
        <p className="text-gray-600 mt-1">
          Unfortunately, the payment could not be completed.
        </p>
        {merchantOrderId && (
          <p className="text-sm text-gray-500 mt-2">
            Order ID: <span className="font-mono">{merchantOrderId}</span>
          </p>
        )}

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/"
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PaymentFailure;
