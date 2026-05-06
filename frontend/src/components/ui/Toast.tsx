import {
	createContext,
	useContext,
	useState,
	useCallback,
	type ReactNode,
	type FC,
} from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
}

export interface ToastContextType {
	toasts: Array<Toast>;
	addToast: (type: ToastType, message: string) => void;
	removeToast: (id: string) => void;
	success: (message: string) => void;
	error: (message: string) => void;
	warning: (message: string) => void;
	info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = (): ToastContextType => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
};

interface ToastProviderProps {
	children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
	const [toasts, setToasts] = useState<Array<Toast>>([]);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	const addToast = useCallback(
		(type: ToastType, message: string) => {
			const id = Math.random().toString(36).substring(2, 9);
			setToasts((prev) => [...prev, { id, type, message }]);
			setTimeout(() => {
				removeToast(id);
			}, 5000);
		},
		[removeToast]
	);

	const success = useCallback(
		(message: string) => {
			addToast("success", message);
		},
		[addToast]
	);
	const error = useCallback(
		(message: string) => {
			addToast("error", message);
		},
		[addToast]
	);
	const warning = useCallback(
		(message: string) => {
			addToast("warning", message);
		},
		[addToast]
	);
	const info = useCallback(
		(message: string) => {
			addToast("info", message);
		},
		[addToast]
	);

	return (
		<ToastContext.Provider
			value={{ toasts, addToast, removeToast, success, error, warning, info }}
		>
			{children}
		</ToastContext.Provider>
	);
};

interface ToastProps {
	toast: Toast;
	onClose: (id: string) => void;
}

const ToastItem: FC<ToastProps> = ({ toast, onClose }): React.ReactElement => {
	const icons: Record<ToastType, string> = {
		success: "✓",
		error: "✕",
		warning: "⚠",
		info: "ℹ",
	};

	const styles: Record<
		ToastType,
		{ bg: string; border: string; icon: string }
	> = {
		success: { bg: "#f0fdf4", border: "#22c55e", icon: "#22c55e" },
		error: { bg: "#fef2f2", border: "#ef4444", icon: "#ef4444" },
		warning: { bg: "#fffbeb", border: "#f59e0b", icon: "#f59e0b" },
		info: { bg: "#eff6ff", border: "#3b82f6", icon: "#3b82f6" },
	};

	const style = styles[toast.type];

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: "12px",
				padding: "12px 16px",
				backgroundColor: style.bg,
				borderLeft: `4px solid ${style.border}`,
				borderRadius: "4px",
				boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
				marginBottom: "8px",
				animation: "slideIn 0.3s ease-out",
			}}
		>
			<span style={{ color: style.icon, fontWeight: "bold", fontSize: "16px" }}>
				{icons[toast.type]}
			</span>
			<span style={{ flex: 1, color: "#333", fontSize: "14px" }}>
				{toast.message}
			</span>
			<button
				aria-label="Close"
				style={{
					background: "none",
					border: "none",
					cursor: "pointer",
					color: "#666",
					fontSize: "16px",
					padding: "0",
					lineHeight: 1,
				}}
				onClick={() => {
					onClose(toast.id);
				}}
			>
				✕
			</button>
		</div>
	);
};

interface ToastContainerProps {
	toasts: Array<Toast>;
	onClose: (id: string) => void;
}

const ToastContainer: FC<ToastContainerProps> = ({
	toasts,
	onClose,
}): React.ReactElement => (
	<div
		style={{
			position: "fixed",
			top: "24px",
			right: "24px",
			zIndex: 9999,
			maxWidth: "400px",
			width: "100%",
		}}
	>
		{toasts.map((toast) => (
			<ToastItem key={toast.id} toast={toast} onClose={onClose} />
		))}
	</div>
);

interface ToastHookProps {
	children: ReactNode;
}

const ToastContainerInternal: FC<{ children: ReactNode }> = ({ children }) => {
	const { toasts, removeToast } = useToast();

	return (
		<>
			<style>
				{`
          @keyframes slideIn {
            from { transform: translateY(-100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}
			</style>
			{children}
			<ToastContainer toasts={toasts} onClose={removeToast} />
		</>
	);
};

export const ToastHook: FC<ToastHookProps> = ({
	children,
}): React.ReactElement => (
	<ToastProvider>
		<ToastContainerInternal>{children}</ToastContainerInternal>
	</ToastProvider>
);

export default ToastProvider;
