'''
Module for wrangling data: cleans and prepares all data sets for analysis 
'''

import numpy as np
import pandas as pd
import geopandas as gpd

CODE = "./state_codes.csv"
POPS = ["./pop_90-99.csv", "./pop_00-10.csv", "./pop_10-19.csv"]
LEG = "./leg_90-19.csv"
ENG = ["./generation_annual.csv", "./emission_annual.csv"]

PUNCTUATION = "!@#$%^&*."
VARS = {"gen": ["gen_mwh", "mwh_pp",], 
        "emit": ["co2_tons", "co2_pp"]}


# FUNCTIONS TO IMPORT AND CLEAN DATA
def load_codes(filename=CODE):
    '''
    Imports and cleans a mapping of state names to two-letter codes

    Inputs: 
        filename (str): the string for the filepath

    Returns: 
        letters (pandas df): cleaned dataframe of state codes data
    '''
    letters = pd.read_csv(filename)
    letters.columns = letters.columns.str.lower()
    letters = letters[["state", "code"]]
    
    letters["code"] = letters["code"].str.upper()

    return letters


def load_clean_pop(filename):
    '''
    Imports and cleans a census estimates dataframe

    Inputs: 
        filename (str): the string for the filepath

    Returns: 
        pop_df (pandas df): cleaned dataframe of population data
    '''
    df = pd.read_csv(filename, header=3, thousands=",")
    df.columns = df.columns.str.lower()
    df = df.dropna()

    keep_cols = [col for col in df.columns if "-" not in col]
    df_yrs = df[keep_cols]

    states_mask = df_yrs.iloc[:, 0].str.startswith(".")
    df_states = df_yrs.loc[states_mask, :]
    df_states.reset_index(drop=True, inplace=True)
    
    if "unnamed" in df_states.columns[0]:
        df_states = df_states.rename(columns={"unnamed: 0": "state"})
    elif "geography" in df_states.columns:
        df_states = df_states.rename(columns={"geography": "state"})

    return df_states


def build_pop(files=POPS):
    '''
    Loads, cleans, and merges all three population data sets

    Inputs: 
        files (lst): list of filepaths for the three data sets (constant)
        codes (str): the filepath to the state codes data

    Returns:
        pop_df (pandas df): a dataframe of population data from 1990-2019
    '''
    letters = load_codes()
    pop_df = load_clean_pop(files[0])

    for filename in files[1:]:
        df = load_clean_pop(filename)
        pop_df = pop_df.merge(df, how="inner", on="state")

    pop_df["state"] = pop_df["state"].str.strip(PUNCTUATION)
    pop_df = letters.merge(pop_df, how="inner", on="state")

    drop_cols = [col for col in pop_df.columns if \
                 col != "state" and len(col) > 4]
    pop_df.drop(columns=drop_cols, inplace=True)

    pop_df = pop_df.melt(id_vars=["state", "code"], 
                         value_vars=[col for col in pop_df.columns if 
                                     col not in ["state", "code"]])
    
    pop_df = pop_df.rename(columns={"variable": "year", "value": "pop"})

    return pop_df


def load_clean_pol(filename=LEG):
    '''
    Loads and cleans a data set with energy data

    Inputs: 
        filename (str): the string for the filepath

    Returns: 
        pol_df (pandas df): cleaned dataframe of power generation data  
    '''
    letters = load_codes()

    df = pd.read_csv(filename)
    df.columns = df.columns.str.lower()

    for col in [col for col in df.columns if col != "state"]:
        df[col] = df[col].str.strip(PUNCTUATION)
        df[col] = df[col].str.replace("Divided", "Split")

    pol_df = letters.merge(df, how="inner", on="state")
    #Nebraska has a unicameral legislature, so I am including it as split
    pol_df.fillna("Split", inplace=True)

    pol_df = pol_df.melt(id_vars=["state", "code"], 
                         value_vars=[col for col in pol_df.columns if 
                                     col not in ["state", "code"]])
    
    pol_df = pol_df.rename(columns={"variable": "year", "value": "pol"})

    return pol_df


def load_clean_eng(filename):
    '''
    Loads and cleans a data set with energy data

    Inputs: 
        filename (str): the string for the filepath

    Returns: 
        eng_df (pandas df): cleaned dataframe of power generation data
    '''
    df = pd.read_csv(filename, thousands=",")
    df.columns = df.columns.str.lower()
    df.columns = df.columns.str.replace(" ", "_", regex=True)
    df.columns = df.columns.str.replace(r"\n", "_", regex=True)

    if "generation" in filename:
        df = df.rename(columns={"energy_source": "src", 
                                "generation_(megawatthours)": "gen_mwh"})
        
        df["renew"] = np.where((df["src"] == "Coal") | 
                               (df["src"] == "Natural Gas") | 
                               (df["src"] == "Petroleum"), "Nonrenewable", "Renewable")

        totals_mask = df.loc[:, "type_of_producer"] == "Total Electric Power Industry"
        keep_cols = [col for col in df.columns if col != "type_of_producer"]

        df = df.loc[df.loc[:, "src"] != "Total", :]    
     
    elif "emission" in filename:
        df = df.rename(columns={"energy_source": "src", 
                                "co2_(metric_tons)": "co2_tons"}) 

        totals_mask = df.loc[:, "producer_type"] == "Total Electric Power Industry"
        keep_cols = ['year', 'state', 'src', 'co2_tons']

    eng_df = df.loc[totals_mask, keep_cols]
    eng_df.reset_index(drop=True, inplace=True)

    eng_df["src"] = eng_df["src"].str.replace("Hydroelectric Conventional", 
                                              "Hydroelectric", regex=True)
    eng_df["src"] = eng_df["src"].str.replace("Wood and Wood Derived Fuels", 
                                              "Other", regex=True)
    eng_df["src"] = eng_df["src"].str.replace("Pumped Storage", 
                                              "Other", regex=True)
    eng_df["src"] = eng_df["src"].str.replace("Other Biomass", 
                                              "Other", regex=True)                   
    eng_df["src"] = eng_df["src"].str.replace("Other Gases", 
                                              "Other", regex=True)
    eng_df["src"] = eng_df["src"].str.replace("Solar Thermal and Photovoltaic", 
                                              "Solar", regex=True)
    eng_df["state"] = eng_df["state"].str.upper()
    
    return eng_df


def build_eng(files=ENG):
    '''
    Loads, cleans, and merges both energy data sets

    Inputs: 
        files (lst): list of filepaths for the three data sets (constant)
        codes (str): the filepath to the state codes data

    Returns:
        pop_df (pandas df): a dataframe of population data from 1990-2019
    '''
    eng_df = load_clean_eng(files[0])
    
    for filename in files[1:]:
        df = load_clean_eng(filename)
        eng_df = eng_df.merge(df, how="left", on=["state", "year", "src"])

    eng_df.fillna(0, inplace=True) 
    eng_df = eng_df.loc[eng_df.loc[:, "state"] != "US-Total", :] 
    eng_df = eng_df.loc[eng_df.loc[:, "state"] != "US-TOTAL", :] 
    eng_df = eng_df.loc[eng_df.loc[:, "state"] != "  ", :] 
    ##remove data from DC bc there's limited data
    eng_df = eng_df.loc[eng_df.loc[:, "state"] != "DC", :] 

    eng_df = eng_df.rename(columns={"state": "code"})

    return eng_df


def build_full():
    '''
    Loads, cleans, and merges all energy data sets

    Inputs: 
        none (defaults in all functions)

    Returns: 
        data (pandas df) a dataframe with all the data
    '''
    eng_df = build_eng()
    pop = build_pop()

    #Merge data sets together
    pop["year"] = pop["year"].astype(int)

    data = pop.merge(eng_df, how="right", on=["year", "code"])

    #Calculate per person emissions/energy
    data["co2_pp"] = data["co2_tons"] / data["pop"]
    data["mwh_pp"] = data["gen_mwh"] / data["pop"]

    data["year"] = data["year"].astype(int)

    return data


def prep_for_js():
    '''
    Preps 3 datasets for use in interactive webapp

    Inputs: 
        None

    Returns: 
        source (json): a json object containing generation data by source
        renew (json): a json object containing generation data by renewables
        emissions (json): a json object containing emissions data
    '''
    data = build_full()
    gb = ["state", "year"]

    src = data.groupby(gb + ["src"])[VARS["gen"]].sum().reset_index()
    src_tot = data.groupby(["year", "src"])[VARS["gen"]].sum()
    src_tot = src_tot.reset_index()
    src_tot["state"] = "United States"
    src_tot = src_tot[gb + ["src"] + VARS["gen"]]
    
    source = pd.concat([src, src_tot]).reset_index(drop=True)

    rnw = data.groupby(gb + ["renew"])[VARS["gen"]].sum().reset_index()
    renew_tot = rnw.groupby(["year", "renew"]).sum().reset_index()
    renew_tot["state"] = "United States"
    renew_tot = renew_tot[gb + ["renew"] + VARS["gen"]]

    renew = pd.concat([rnw, renew_tot]).reset_index(drop=True)

    emit = data.groupby(gb)[VARS["emit"]].sum().reset_index()
    emit_tot = emit.groupby(["year"]).sum().reset_index()
    emit_tot["state"] = "United States"
    emit_tot = emit_tot[gb + VARS["emit"]]

    emissions = pd.concat([emit, emit_tot]).reset_index(drop=True)

    source.to_json('./source.json', orient="records")
    renew.to_json('./renewables.json', orient="records")
    emissions.to_json('./emissions.json', orient="records")

    # return source, renew, emissions
