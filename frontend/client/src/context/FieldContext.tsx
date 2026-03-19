import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { API_BASE_URL } from "@/lib/api";
import { FieldPolygon } from "@/types/field";

export interface Field {
    id: number;
    name: string;
    cropType: string;
    polygon: FieldPolygon;
    created_at: string;
    area?: number;
}

interface FieldContextType {
    fields: Field[];
    selectedField: Field | null;
    loading: boolean;
    setSelectedField: (field: Field | null) => void;
    refreshFields: () => Promise<void>;
    deleteField: (fieldId: number) => Promise<boolean>;
    awdData: any;
    setAwdData: (data: any) => void;
    ccData: any;
    setCcData: (data: any) => void;
    healthData: any;
    setHealthData: (data: any) => void;
    predictionData: any;
    setPredictionData: (data: any) => void;
}

const FieldContext = createContext<FieldContextType | undefined>(undefined);

export const FieldProvider = ({ children }: { children: ReactNode }) => {
    const { token } = useAuth();
    const [fields, setFields] = useState<Field[]>([]);
    const [selectedField, setSelectedField] = useState<Field | null>(null);
    const [loading, setLoading] = useState(false);
    const [awdData, setAwdData] = useState<any>(null);
    const [ccData, setCcData] = useState<any>(null);
    const [healthData, setHealthData] = useState<any>(null);
    const [predictionData, setPredictionData] = useState<any>(null);

    // Fetch fields from backend
    const refreshFields = async () => {
        if (!token) {
            setFields([]);
            setSelectedField(null);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/field/data`, {
                headers: {
                    Authorization: `Token ${token}`,
                },
            });

            if (res.ok) {
                const data = await res.json();
                setFields(data);

                // Select first field by default if none selected or if selected is not in list
                if (data.length > 0) {
                    if (selectedField) {
                        const updated = data.find((f: Field) => f.id === selectedField.id);
                        if (updated) {
                            setSelectedField(updated);
                        } else {
                            setSelectedField(data[0]);
                        }
                    } else {
                        setSelectedField(data[0]);
                    }
                } else {
                    setSelectedField(null);
                }
            } else {
                console.error("Failed to fetch fields");
            }
        } catch (error) {
            console.error("Error fetching fields:", error);
        } finally {
            setLoading(false);
        }
    };

    // Delete a field by ID
    const deleteField = async (fieldId: number): Promise<boolean> => {
        if (!token) return false;

        try {
            const res = await fetch(`${API_BASE_URL}/field/data/${fieldId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Token ${token}`,
                },
            });

            if (res.ok || res.status === 204) {
                // If deleted field was selected, clear selection
                if (selectedField?.id === fieldId) {
                    setSelectedField(null);
                }
                // Refresh the fields list
                await refreshFields();
                return true;
            } else {
                console.error("Failed to delete field");
                return false;
            }
        } catch (error) {
            console.error("Error deleting field:", error);
            return false;
        }
    };

    useEffect(() => {
        refreshFields();
    }, [token]);

    return (
        <FieldContext.Provider value={{ 
            fields, 
            selectedField, 
            loading, 
            setSelectedField: (f) => {
                if (f?.id !== selectedField?.id) {
                    setAwdData(null);
                    setCcData(null);
                    setHealthData(null);
                    setPredictionData(null);
                }
                setSelectedField(f);
            }, 
            refreshFields, 
            deleteField,
            awdData,
            setAwdData,
            ccData,
            setCcData,
            healthData,
            setHealthData,
            predictionData,
            setPredictionData
        }}>
            {children}
        </FieldContext.Provider>
    );
};

export const useField = () => {
    const context = useContext(FieldContext);
    if (!context) {
        throw new Error("useField must be used within a FieldProvider");
    }
    return context;
};
