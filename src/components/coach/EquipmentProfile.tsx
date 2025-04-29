import React, { useState, useEffect } from 'react';
import { EquipmentProfile as EquipmentProfileType, EquipmentConstraint } from '@/types/workout';
import * as db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface EquipmentProfileProps {
  onProfileSelected: (profile: EquipmentProfileType) => void;
}

export default function EquipmentProfile({ onProfileSelected }: EquipmentProfileProps) {
  const [profiles, setProfiles] = useState<EquipmentProfileType[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newProfile, setNewProfile] = useState<Partial<EquipmentProfileType>>({
    name: '',
    location: '',
    constraints: [],
    isDefault: false
  });
  
  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);
  
  // Select default profile when profiles are loaded
  useEffect(() => {
    if (profiles.length > 0 && !selectedProfileId) {
      const defaultProfile = profiles.find(p => p.isDefault) || profiles[0];
      setSelectedProfileId(defaultProfile.id);
      onProfileSelected(defaultProfile);
    }
  }, [profiles, selectedProfileId, onProfileSelected]);
  
  // Load equipment profiles from the database
  const loadProfiles = async () => {
    try {
      const storedProfiles = await db.getAll('equipment-profiles');
      
      if (storedProfiles.length === 0) {
        // Create a default profile if none exist
        const defaultProfile: EquipmentProfileType = {
          id: uuidv4(),
          name: 'Default Gym',
          location: 'Commercial Gym',
          constraints: [
            {
              minWeight: 5,
              maxWeight: 500,
              incrementSize: 5,
              notes: 'Standard gym equipment'
            }
          ],
          isDefault: true
        };
        
        await db.put('equipment-profiles', defaultProfile);
        setProfiles([defaultProfile]);
      } else {
        setProfiles(storedProfiles);
      }
    } catch (err) {
      console.error('Error loading equipment profiles:', err);
    }
  };
  
  // Handle profile selection
  const handleProfileSelect = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setSelectedProfileId(profileId);
      onProfileSelected(profile);
    }
  };
  
  // Handle adding a new profile
  const handleAddProfile = async () => {
    if (!newProfile.name || !newProfile.location) return;
    
    const profile: EquipmentProfileType = {
      id: uuidv4(),
      name: newProfile.name || 'New Profile',
      location: newProfile.location || 'Unknown',
      constraints: newProfile.constraints || [],
      isDefault: newProfile.isDefault || false
    };
    
    // If this is the first profile or marked as default, update other profiles
    if (profile.isDefault || profiles.length === 0) {
      profile.isDefault = true;
      
      // Update existing profiles to not be default
      for (const existingProfile of profiles) {
        if (existingProfile.isDefault) {
          existingProfile.isDefault = false;
          await db.put('equipment-profiles', existingProfile);
        }
      }
    }
    
    try {
      await db.put('equipment-profiles', profile);
      setProfiles([...profiles, profile]);
      setSelectedProfileId(profile.id);
      onProfileSelected(profile);
      
      // Reset form
      setNewProfile({
        name: '',
        location: '',
        constraints: [],
        isDefault: false
      });
      setShowForm(false);
    } catch (err) {
      console.error('Error saving equipment profile:', err);
    }
  };
  
  // Handle adding a constraint to the profile
  const handleAddConstraint = () => {
    setNewProfile({
      ...newProfile,
      constraints: [
        ...(newProfile.constraints || []),
        {
          minWeight: 0,
          maxWeight: 0,
          incrementSize: 0,
          notes: ''
        }
      ]
    });
  };
  
  // Handle updating a constraint
  const handleConstraintChange = (index: number, field: keyof EquipmentConstraint, value: any) => {
    const updatedConstraints = [...(newProfile.constraints || [])];
    updatedConstraints[index] = {
      ...updatedConstraints[index],
      [field]: field === 'notes' ? value : Number(value)
    };
    
    setNewProfile({
      ...newProfile,
      constraints: updatedConstraints
    });
  };
  
  // Handle removing a constraint
  const handleRemoveConstraint = (index: number) => {
    const updatedConstraints = [...(newProfile.constraints || [])];
    updatedConstraints.splice(index, 1);
    
    setNewProfile({
      ...newProfile,
      constraints: updatedConstraints
    });
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Equipment Profiles</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Profile
        </label>
        <div className="flex flex-wrap gap-2">
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => handleProfileSelect(profile.id)}
              className={`text-sm rounded-md px-3 py-1.5 ${
                selectedProfileId === profile.id
                  ? 'bg-indigo-100 border border-indigo-300 text-indigo-700'
                  : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {profile.name}
              {profile.isDefault && ' (Default)'}
            </button>
          ))}
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm bg-white border border-dashed border-gray-300 text-gray-500 rounded-md px-3 py-1.5 hover:bg-gray-50"
          >
            {showForm ? 'Cancel' : '+ Add New'}
          </button>
        </div>
      </div>
      
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
          <h3 className="text-md font-medium text-gray-800 mb-3">New Equipment Profile</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Name
              </label>
              <input
                type="text"
                value={newProfile.name}
                onChange={(e) => setNewProfile({...newProfile, name: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Home Gym, Commercial Gym, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={newProfile.location}
                onChange={(e) => setNewProfile({...newProfile, location: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Home, LA Fitness, etc."
              />
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Equipment Constraints
              </label>
              <button
                onClick={handleAddConstraint}
                className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md px-2 py-1 hover:bg-indigo-100"
              >
                + Add Constraint
              </button>
            </div>
            
            {(newProfile.constraints || []).length === 0 ? (
              <p className="text-sm text-gray-500 italic">No constraints added yet.</p>
            ) : (
              <div className="space-y-3">
                {(newProfile.constraints || []).map((constraint, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-md p-3">
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Min Weight
                        </label>
                        <input
                          type="number"
                          value={constraint.minWeight || 0}
                          onChange={(e) => handleConstraintChange(index, 'minWeight', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Max Weight
                        </label>
                        <input
                          type="number"
                          value={constraint.maxWeight || 0}
                          onChange={(e) => handleConstraintChange(index, 'maxWeight', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Increment
                        </label>
                        <input
                          type="number"
                          value={constraint.incrementSize || 0}
                          onChange={(e) => handleConstraintChange(index, 'incrementSize', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <input
                        type="text"
                        value={constraint.notes || ''}
                        onChange={(e) => handleConstraintChange(index, 'notes', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                        placeholder="Notes (e.g., dumbbells only go up to 50 lbs)"
                      />
                      
                      <button
                        onClick={() => handleRemoveConstraint(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="isDefault"
              checked={newProfile.isDefault || false}
              onChange={(e) => setNewProfile({...newProfile, isDefault: e.target.checked})}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
              Set as default profile
            </label>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleAddProfile}
              disabled={!newProfile.name || !newProfile.location}
              className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              Save Profile
            </button>
          </div>
        </div>
      )}
      
      {/* Show selected profile details */}
      {selectedProfileId && !showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h3 className="text-md font-medium text-gray-800 mb-1">
            {profiles.find(p => p.id === selectedProfileId)?.name}
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            Location: {profiles.find(p => p.id === selectedProfileId)?.location}
          </p>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Equipment Constraints:</h4>
            {profiles.find(p => p.id === selectedProfileId)?.constraints.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No specific constraints.</p>
            ) : (
              <ul className="space-y-2">
                {profiles.find(p => p.id === selectedProfileId)?.constraints.map((constraint, index) => (
                  <li key={index} className="text-sm bg-white border border-gray-200 rounded-md p-2">
                    <div className="grid grid-cols-3 gap-2 mb-1">
                      <div>
                        <span className="text-xs text-gray-500">Min:</span> {constraint.minWeight}
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Max:</span> {constraint.maxWeight}
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Increment:</span> {constraint.incrementSize}
                      </div>
                    </div>
                    {constraint.notes && (
                      <div className="text-xs text-gray-600">{constraint.notes}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 