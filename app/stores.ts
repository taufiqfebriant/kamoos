import create from 'zustand';

interface InvalidateDefinitionState {
	id: string | null;
	setId: (id: string | null) => void;
}

export const useInvalidateDefinition = create<InvalidateDefinitionState>()(
	set => ({
		id: null,
		setId: id => set(() => ({ id }))
	})
);
